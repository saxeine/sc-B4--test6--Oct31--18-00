import React, { useState, useMemo } from "react";
import {
  X,
  CheckCircle2,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  Film,
  Type,
  FileText,
  Play,
  ArrowRight,
  Layers,
  Mic,
  MicOff,
  Wand2,
  Volume2,
  ChevronDown,
  ChevronUp,
  Radio,
  Lightbulb,
} from "lucide-react";
import { useSpeechRecognition } from "../utils/useSpeechRecognition";
import {
  DIALOGUE_CATEGORIES,
  POPULAR_SPEAKERS,
  generateContextualSuggestions,
} from "../utils/suggestiveDialogueData";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface Caption {
  id: string;
  speaker?: string;
  text: string;
}

export interface Slide {
  id: string;
  shotNo: number;
  imageUrl: string;
  action: string;
  captions?: Caption[];
}

interface ScreenplayWriterProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  activeSlideId: string;
  onSelectSlideId: (id: string) => void;
  onUpdateSlides: (slides: Slide[]) => void;
  onSyncToStoryboard?: (sliceIdx: number, newImageUrl: string) => void;
  onOpenBubba1Studio?: (imageUrl: string, nameHint: string) => void;
  onSendToNeo1: (url: string, name: string) => void;
}

export const ScreenplayWriter: React.FC<ScreenplayWriterProps> = ({
  isOpen,
  onClose,
  slides,
  activeSlideId,
  onSelectSlideId,
  onUpdateSlides,
  onSyncToStoryboard,
  onOpenBubba1Studio,
  onSendToNeo1,
}) => {
  const [newCaptionText, setNewCaptionText] = useState("");
  const [newSpeaker, setNewSpeaker] = useState("");
  const [isDescribing, setIsDescribing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("action");
  const [showSuggestionsDrawer, setShowSuggestionsDrawer] = useState(true);
  const [activeMicField, setActiveMicField] = useState<"dialogue" | "speaker" | "action" | null>(null);

  const activeSlide = slides.find((s) => s.id === activeSlideId) || slides[0];

  // Speech Recognition Hook
  const {
    isListening,
    interimTranscript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  // Handle Mic input toggle for specific fields
  const handleToggleMic = (field: "dialogue" | "speaker" | "action") => {
    if (isListening && activeMicField === field) {
      stopListening();
      setActiveMicField(null);
    } else {
      setActiveMicField(field);
      startListening((transcript) => {
        if (field === "dialogue") {
          setNewCaptionText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else if (field === "speaker") {
          setNewSpeaker(transcript.trim());
        } else if (field === "action" && activeSlide) {
          const updatedAction = activeSlide.action ? `${activeSlide.action} ${transcript}` : transcript;
          onUpdateSlides(
            slides.map((s) => (s.id === activeSlide.id ? { ...s, action: updatedAction } : s))
          );
        }
      });
    }
  };

  // Contextual smart suggestions computed dynamically
  const smartSuggestions = useMemo(() => {
    if (!activeSlide) return [];
    return generateContextualSuggestions(activeSlide.shotNo || 1, activeSlide.action, activeSlide.captions || []);
  }, [activeSlide?.shotNo, activeSlide?.action, activeSlide?.captions]);

  if (!isOpen) return null;

  // Helper to describe frame
  const handleDescribeFrame = async (slide: Slide) => {
    if (!slide) return;
    setIsDescribing(true);
    try {
      // Simulate/AI frame caption generator
      const mockCaptions = [
        { id: "c-" + Date.now() + "-1", speaker: "Hero", text: "Look over there!" },
        { id: "c-" + Date.now() + "-2", speaker: "Sidekick", text: "Is that what I think it is?" },
      ];
      const updatedSlides = slides.map((s) => {
        if (s.id === slide.id) {
          return {
            ...s,
            action: s.action || "Characters reacting to scene",
            captions: s.captions && s.captions.length > 0 ? s.captions : mockCaptions,
          };
        }
        return s;
      });
      onUpdateSlides(updatedSlides);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDescribing(false);
    }
  };

  // Primary handleApplyBubbles function requested
  const handleApplyBubbles = async () => {
    const targetSlide = slides.find((s) => s.id === activeSlideId) || activeSlide;
    if (!targetSlide || !targetSlide.captions || targetSlide.captions.length === 0) return;

    try {
      const img = new Image();
      if (targetSlide.imageUrl.startsWith("http://") || targetSlide.imageUrl.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = targetSlide.imageUrl;
      });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    targetSlide.captions.forEach((caption, index) => {
      const text = caption.speaker ? `${caption.speaker}: ${caption.text}` : caption.text;
      ctx.font = "bold 24px sans-serif";

      const maxWidth = canvas.width * 0.4;
      const words = text.split(" ");
      let line = "";
      const lines: string[] = [];
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineHeight = 30;
      const textHeight = lines.length * lineHeight;
      const padding = 20;
      const bubbleWidth = Math.max(...lines.map((l) => ctx.measureText(l).width)) + padding * 2;
      const bubbleHeight = textHeight + padding * 2;

      const x = index % 2 === 0 ? canvas.width * 0.05 : canvas.width * 0.95 - bubbleWidth;
      const y = canvas.height * 0.05 + Math.floor(index / 2) * (bubbleHeight + 50);

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;

      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, bubbleWidth, bubbleHeight, 15);
      } else {
        ctx.rect(x, y, bubbleWidth, bubbleHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      if (index % 2 === 0) {
        ctx.moveTo(x + bubbleWidth * 0.8, y + bubbleHeight);
        ctx.lineTo(x + bubbleWidth * 0.9, y + bubbleHeight + 40);
        ctx.lineTo(x + bubbleWidth * 0.6, y + bubbleHeight);
      } else {
        ctx.moveTo(x + bubbleWidth * 0.2, y + bubbleHeight);
        ctx.lineTo(x + bubbleWidth * 0.1, y + bubbleHeight + 40);
        ctx.lineTo(x + bubbleWidth * 0.4, y + bubbleHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#000000";
      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), x + padding, y + padding + 24 + i * lineHeight);
      });
    });

    const newImageUrl = canvas.toDataURL("image/jpeg", 0.9);

    const newSlide: Slide = {
      ...targetSlide,
      id: "slide-" + Date.now(),
      shotNo: targetSlide.shotNo + 1,
      imageUrl: newImageUrl,
      action: targetSlide.action + " (Bubbles Applied)",
      captions: [],
    };

    const newSlides = [...slides];
    const idx = newSlides.findIndex((s) => s.id === (activeSlideId || targetSlide.id));
    newSlides.splice(idx + 1, 0, newSlide);

    if (onSyncToStoryboard && idx !== -1) {
      onSyncToStoryboard(idx + 1, newImageUrl);
    }

    onUpdateSlides(newSlides);
    onSelectSlideId(newSlide.id);
    } catch (err) {
      console.error("Failed to apply bubbles to slide:", err);
    }
  };

  const handleApplyBubblesToCurrent = async () => {
    const targetSlide = slides.find((s) => s.id === activeSlideId) || activeSlide;
    if (!targetSlide || !targetSlide.captions || targetSlide.captions.length === 0) return;

    try {
      const img = new Image();
      if (targetSlide.imageUrl.startsWith("http://") || targetSlide.imageUrl.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = targetSlide.imageUrl;
      });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    targetSlide.captions.forEach((caption, index) => {
      const text = caption.speaker ? `${caption.speaker}: ${caption.text}` : caption.text;
      ctx.font = "bold 24px sans-serif";

      const maxWidth = canvas.width * 0.4;
      const words = text.split(" ");
      let line = "";
      const lines: string[] = [];
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineHeight = 30;
      const textHeight = lines.length * lineHeight;
      const padding = 20;
      const bubbleWidth = Math.max(...lines.map((l) => ctx.measureText(l).width)) + padding * 2;
      const bubbleHeight = textHeight + padding * 2;

      const x = index % 2 === 0 ? canvas.width * 0.05 : canvas.width * 0.95 - bubbleWidth;
      const y = canvas.height * 0.05 + Math.floor(index / 2) * (bubbleHeight + 50);

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;

      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, bubbleWidth, bubbleHeight, 15);
      } else {
        ctx.rect(x, y, bubbleWidth, bubbleHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      if (index % 2 === 0) {
        ctx.moveTo(x + bubbleWidth * 0.8, y + bubbleHeight);
        ctx.lineTo(x + bubbleWidth * 0.9, y + bubbleHeight + 40);
        ctx.lineTo(x + bubbleWidth * 0.6, y + bubbleHeight);
      } else {
        ctx.moveTo(x + bubbleWidth * 0.2, y + bubbleHeight);
        ctx.lineTo(x + bubbleWidth * 0.1, y + bubbleHeight + 40);
        ctx.lineTo(x + bubbleWidth * 0.4, y + bubbleHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#000000";
      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), x + padding, y + padding + 24 + i * lineHeight);
      });
    });

    const newImageUrl = canvas.toDataURL("image/jpeg", 0.9);

    const updatedSlides = slides.map((s) => {
      if (s.id === targetSlide.id) {
        return {
          ...s,
          imageUrl: newImageUrl,
        };
      }
      return s;
    });

    const idx = slides.findIndex((s) => s.id === targetSlide.id);
    if (onSyncToStoryboard && idx !== -1) {
      onSyncToStoryboard(idx, newImageUrl);
    }

    onUpdateSlides(updatedSlides);
    } catch (err) {
      console.error("Failed to apply bubbles to current slide:", err);
    }
  };

  // Add a new caption line
  const handleAddCaption = () => {
    if (!newCaptionText.trim() || !activeSlide) return;
    const newCap: Caption = {
      id: "cap-" + Date.now(),
      speaker: newSpeaker.trim() || undefined,
      text: newCaptionText.trim(),
    };
    const updated = slides.map((s) => {
      if (s.id === activeSlide.id) {
        return {
          ...s,
          captions: [...(s.captions || []), newCap],
        };
      }
      return s;
    });
    onUpdateSlides(updated);
    setNewCaptionText("");
    setNewSpeaker("");
  };

  // Delete a caption line
  const handleDeleteCaption = (captionId: string) => {
    if (!activeSlide) return;
    const updated = slides.map((s) => {
      if (s.id === activeSlide.id) {
        return {
          ...s,
          captions: (s.captions || []).filter((c) => c.id !== captionId),
        };
      }
      return s;
    });
    onUpdateSlides(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#020617] border border-[#1e293b] rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] bg-[#0f172a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="screenplay_writer_item_22"
                as="h2"
                className="text-base font-extrabold text-white flex items-center gap-2"
              >
                  {() => (
                      <>
                        <span>{uiText("components_screenplay_writer.span.screenplay_and_speech_studio", "Screenplay & Speech Studio")}</span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">
                  {slides.length}{uiText("components_screenplay_writer.span.shots", " Shots")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">
                {uiText("components_screenplay_writer.p.write_screenplay_dialogue_captions_and_autom", "Write screenplay dialogue captions and automatically burn speech bubbles into canvas frames.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Generate Scene Captions (Icon-only) */}
            <CustomizableButton
              buttonId="screenplay_writer_btn_21"
              defaultIcon={<Sparkles className={`w-4 h-4 text-purple-400 ${isDescribing ? "animate-spin" : ""}`} />}
              type="button"
onClick={() => activeSlide && handleDescribeFrame(activeSlide)}
disabled={!activeSlide || isDescribing}
className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer shadow-sm flex items-center justify-center"
title={isDescribing ? "Generating Scene Captions..." : "Auto-Generate Scene Captions"}
            />

            {/* Send Carve Slice to Neo1 (Icon-only) */}
            <CustomizableButton
              buttonId="screenplay_writer_btn_20"
              defaultIcon={<Layers className="w-4 h-4 text-[#00f0ff]" />}
              type="button"
onClick={() => activeSlide && onSendToNeo1(activeSlide.imageUrl, activeSlide.action || `Frame ${activeSlide.shotNo}`)}
disabled={!activeSlide}
className="p-2 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer shadow-sm flex items-center justify-center"
title={uiText("components_screenplay_writer.button.send_carve_slice_to_neo1.title", "Send Carve Slice to Neo1")}
            />

            {/* Send Carve Slice to Bubba1 (Icon-only) */}
            <CustomizableButton
              buttonId="screenplay_writer_btn_19"
              defaultIcon={<MessageSquare className="w-4 h-4 text-purple-400" />}
              type="button"
onClick={() => activeSlide && onOpenBubba1Studio?.(activeSlide.imageUrl, activeSlide.action || `Shot ${activeSlide.shotNo}`)}
disabled={!activeSlide || !onOpenBubba1Studio}
className="p-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer shadow-sm flex items-center justify-center"
title={uiText("components_screenplay_writer.button.send_carve_slice_to_bubba1.title", "Send Carve Slice to bubba1")}
            />

            <div className="w-[1px] h-6 bg-[#1e293b] mx-1" />

            <CustomizableButton
              buttonId="screenplay_writer_btn_18"
              defaultIcon={<X className="w-5 h-5" />}
              onClick={onClose}
className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
title={uiText("components_screenplay_writer.button.close_screenplay_and_speech_studio.title", "Close Screenplay & Speech Studio")}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Shots Carousel / Navigation */}
          <div className="w-64 border-r border-[#1e293b] bg-[#070d1e] p-3 overflow-y-auto flex flex-col gap-2 shrink-0">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2 py-1 flex items-center justify-between">
              <span>{uiText("components_screenplay_writer.span.storyboard_shots", "Storyboard Shots")}</span>
              <Film className="w-3.5 h-3.5 text-slate-500" />
            </div>

            {slides.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic border border-dashed border-[#1e293b] rounded-xl">
                {uiText("components_screenplay_writer.div.no_storyboard_slides_available", "No storyboard slides available.")}
              </div>
            ) : (
              slides.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => onSelectSlideId(s.id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex gap-2.5 items-center ${
                    activeSlide?.id === s.id
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                      : "bg-[#0f172a] border-[#1e293b] text-slate-300 hover:bg-[#1e293b]"
                  }`}
                >
                  <div className="w-14 h-10 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                    <img src={s.imageUrl} alt={`Shot ${s.shotNo}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{uiText("components_screenplay_writer.div.shot", "Shot #")}{s.shotNo || idx + 1}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {s.captions && s.captions.length > 0
                        ? `${s.captions.length} dialogue line${s.captions.length > 1 ? "s" : ""}`
                        : "No captions"}
                    </div>
                  </div>
                  {onOpenBubba1Studio && (
                    <CustomizableButton
                      buttonId="screenplay_writer_btn_17"
                      defaultIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      type="button"
onClick={(e) => {
                        e.stopPropagation();
                        onOpenBubba1Studio(s.imageUrl, `Shot ${s.shotNo}`);
                      }}
className="p-1.5 text-slate-500 hover:text-purple-400 rounded-lg hover:bg-purple-950/40 transition-colors cursor-pointer shrink-0"
title={uiText("components_screenplay_writer.button.edit_in_bubba1_studio.title", "Edit in Bubba1 Studio")}
                    />
                  )}
                  <CustomizableButton
                    buttonId="screenplay_writer_btn_16"
                    defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                    type="button"
onClick={(e) => {
                      e.stopPropagation();
                      const updated = slides.filter((slide) => slide.id !== s.id);
                      onUpdateSlides(updated);
                      if (activeSlide?.id === s.id && updated.length > 0) {
                        onSelectSlideId(updated[0].id);
                      }
                    }}
className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
title={uiText("components_screenplay_writer.button.delete_whole_frame.title", "Delete Whole Frame")}
                  />
                </div>
              ))
            )}
          </div>

          {/* Center Panel: Active Frame Preview */}
          <div className="flex-1 bg-[#020617] p-6 flex flex-col items-center justify-center relative overflow-auto">
            {activeSlide ? (
              <div className="flex flex-col items-center max-w-full max-h-full">
                <div className="relative border-2 border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl bg-slate-950 group max-h-[72vh]">
                  <img
                    src={activeSlide.imageUrl}
                    alt={`Shot ${activeSlide.shotNo}`}
                    className="max-h-[70vh] w-auto object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-400 border border-slate-700">
                    {uiText("components_screenplay_writer.div.shot_2", "Shot #")}{activeSlide.shotNo}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm italic">{uiText("components_screenplay_writer.div.select_a_shot_to_start_editing_captions", "Select a shot to start editing captions.")}</div>
            )}
          </div>

          {/* Right Panel: Caption & Dialogue Editor */}
          <div className="w-[420px] border-l border-[#1e293b] bg-[#070d1e] p-4 flex flex-col gap-3.5 overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-slate-800">
            {activeSlide ? (
              <>
                {/* Shot Action / Description with Voice Mic Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CustomizableLabel
                      labelId="screenplay_writer_item_15"
                      as="label"
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
                    >
                        {() => (
                            <>
                              {uiText("components_screenplay_writer.label.shot_action_description", "Shot Action / Description")}
                            </>
                          )}
                    </CustomizableLabel>
                    <CustomizableButton
                      buttonId="screenplay_writer_btn_14"
                      type="button"
onClick={() => handleToggleMic("action")}
className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer ${
                        isListening && activeMicField === "action"
                          ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-900/50"
                          : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                      }`}
title={isListening && activeMicField === "action" ? "Stop dictation" : "Voice dictation for action description"}
                    >
                        {() => (
                            <>
                              {isListening && activeMicField === "action" ? (
                        <>
                          <Mic className="w-3 h-3 text-white" />
                          <span>{uiText("components_screenplay_writer.span.listening", "Listening...")}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 text-emerald-400" />
                          <span>{uiText("components_screenplay_writer.span.voice_action", "Voice Action")}</span>
                        </>
                      )}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeSlide.action || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateSlides(
                          slides.map((s) => (s.id === activeSlide.id ? { ...s, action: val } : s))
                        );
                      }}
                      placeholder={uiText("components_screenplay_writer.input.e_g_close_up_shot_character_turns_around.placeholder", "E.g., Close-up shot, character turns around...")}
                      className={`w-full bg-[#020617] border rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none transition ${
                        isListening && activeMicField === "action"
                          ? "border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)] ring-1 ring-rose-500"
                          : "border-[#1e293b] focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Caption List */}
                <div className="flex flex-col gap-1.5 min-h-[140px] max-h-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {uiText("components_screenplay_writer.span.dialogue_lines", "Dialogue Lines (")}{activeSlide.captions?.length || 0})
                    </span>
                  </div>

                  <div className="flex-1 border border-[#1e293b] bg-[#020617] rounded-xl p-2 overflow-y-auto space-y-1.5">
                    {(!activeSlide.captions || activeSlide.captions.length === 0) ? (
                      <div className="text-center text-xs text-slate-500 py-6 italic">
                        {uiText("components_screenplay_writer.div.no_dialogue_lines_added_for_this_shot_yet_ad", "No dialogue lines added for this shot yet. Add one below or click a suggestion!")}
                      </div>
                    ) : (
                      activeSlide.captions.map((cap, i) => (
                        <div
                          key={cap.id}
                          className="bg-[#0f172a] border border-[#1e293b] p-2 rounded-lg flex items-start justify-between gap-2 group hover:border-emerald-500/40 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            {cap.speaker && (
                              <span className="text-[10px] font-extrabold text-cyan-400 block uppercase">
                                {cap.speaker}
                              </span>
                            )}
                            <p className="text-xs text-slate-200 font-medium leading-relaxed break-words">
                              "{cap.text}"
                            </p>
                          </div>
                          <CustomizableButton
                            buttonId="screenplay_writer_btn_13"
                            defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => handleDeleteCaption(cap.id)}
className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded cursor-pointer"
title={uiText("components_screenplay_writer.button.delete_caption.title", "Delete caption")}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* New Caption Input with Live Mic Speech Dictation */}
                <div className="space-y-2.5 bg-[#020617] p-3 border border-[#1e293b] rounded-xl relative shadow-inner">
                  {/* Speaker quick pills & Speaker input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="screenplay_writer_item_12"
                        as="label"
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                          {() => (
                              <>
                                {uiText("components_screenplay_writer.label.speaker", "Speaker")}
                              </>
                            )}
                      </CustomizableLabel>
                      <CustomizableButton
                        buttonId="screenplay_writer_btn_11"
                        defaultIcon={<Mic className="w-2.5 h-2.5" />}
                        type="button"
onClick={() => handleToggleMic("speaker")}
className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 transition cursor-pointer ${
                          isListening && activeMicField === "speaker"
                            ? "bg-rose-500 text-white animate-pulse"
                            : "text-slate-400 hover:text-cyan-300"
                        }`}
title={uiText("components_screenplay_writer.button.dictate_speaker_name.title", "Dictate Speaker Name")}
                      >
                          {() => (
                              <>
                                <span>{isListening && activeMicField === "speaker" ? "Listening..." : "Mic"}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    <input
                      type="text"
                      value={newSpeaker}
                      onChange={(e) => setNewSpeaker(e.target.value)}
                      placeholder={uiText("components_screenplay_writer.input.e_g_hero_detective_ai.placeholder", "e.g. Hero, Detective, AI...")}
                      className={`w-full bg-[#0f172a] border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition ${
                        isListening && activeMicField === "speaker"
                          ? "border-rose-500 ring-1 ring-rose-500"
                          : "border-[#1e293b] focus:border-cyan-500"
                      }`}
                    />

                    {/* Quick Speaker Selector Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                      {POPULAR_SPEAKERS.slice(0, 7).map((spk) => (
                        <CustomizableButton
                          buttonId="screenplay_writer_btn_10"
                          key={spk}
type="button"
onClick={() => setNewSpeaker(spk)}
className={`text-[9.5px] px-1.5 py-0.5 rounded border transition shrink-0 cursor-pointer font-medium ${
                            newSpeaker.toLowerCase() === spk.toLowerCase()
                              ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                            {() => (
                                <>
                                  {spk}
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>
                  </div>

                  {/* Dialogue Input & Mic Dictation */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="screenplay_writer_item_9"
                        as="label"
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                          {() => (
                              <>
                                {uiText("components_screenplay_writer.label.dialogue_text", "Dialogue Text")}
                              </>
                            )}
                      </CustomizableLabel>
                      <CustomizableButton
                        buttonId="screenplay_writer_btn_8"
                        defaultIcon={<Mic className="w-3 h-3" />}
                        type="button"
onClick={() => handleToggleMic("dialogue")}
className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                          isListening && activeMicField === "dialogue"
                            ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-900/60"
                            : "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60"
                        }`}
title={isListening && activeMicField === "dialogue" ? "Stop dictation" : "Live Speech-to-Text Microphone Dictation"}
                      >
                          {() => (
                              <>
                                <span>{isListening && activeMicField === "dialogue" ? "Listening (Stop)" : "Mic Voice"}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    <div className="relative">
                      <textarea
                        value={newCaptionText}
                        onChange={(e) => setNewCaptionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddCaption();
                          }
                        }}
                        rows={2}
                        placeholder={uiText("components_screenplay_writer.textarea.type_dialogue_or_click_mic_to_speak.placeholder", "Type dialogue or click mic to speak...")}
                        className={`w-full bg-[#0f172a] border rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none resize-none transition font-sans ${
                          isListening && activeMicField === "dialogue"
                            ? "border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)] ring-1 ring-rose-500"
                            : "border-[#1e293b] focus:border-emerald-500"
                        }`}
                      />
                      {isListening && activeMicField === "dialogue" && interimTranscript && (
                        <div className="text-[10px] text-rose-300 italic px-1 pt-0.5 flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 animate-pulse text-rose-400" />
                          <span>{uiText("components_screenplay_writer.span.hearing", "Hearing: \"")}{interimTranscript}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <CustomizableButton
                      buttonId="screenplay_writer_btn_7"
                      defaultIcon={<Plus className="w-4 h-4" />}
                      onClick={handleAddCaption}
disabled={!newCaptionText.trim()}
className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_screenplay_writer.span.add_dialogue_line", "Add Dialogue Line")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>

                {/* SUGGESTIVE TEXT & DIALOGUE AUTOCOMPLETE DRAWER */}
                <div className="bg-[#020617] border border-[#1e293b] rounded-xl overflow-hidden shadow-md flex flex-col">
                  {/* Drawer Header */}
                  <div
                    onClick={() => setShowSuggestionsDrawer(!showSuggestionsDrawer)}
                    className="px-3 py-2 bg-[#0a1224] border-b border-[#1e293b] flex items-center justify-between cursor-pointer select-none hover:bg-[#0e172e] transition"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uiText("components_screenplay_writer.span.suggestive_dialogue_studio", "Suggestive Dialogue Studio")}</span>
                      <span className="text-[9px] bg-amber-950 text-amber-300 font-mono px-1.5 py-0.2 rounded border border-amber-800">
                        {uiText("components_screenplay_writer.span.smart_ai", "Smart AI")}
                      </span>
                    </div>
                    <CustomizableButton
                      buttonId="screenplay_writer_btn_6"
                      className="text-slate-400 hover:text-white"
                    >
                        {() => (
                            <>
                              {showSuggestionsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {showSuggestionsDrawer && (
                    <div className="p-2.5 flex flex-col gap-2.5">
                      {/* Contextual Smart Suggestions Card */}
                      {smartSuggestions.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-800/40 rounded-lg p-2 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-purple-300">
                            <span className="flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-amber-400" />
                              {uiText("components_screenplay_writer.span.shot", "Shot #")}{activeSlide.shotNo}{uiText("components_screenplay_writer.span.smart_suggestions", " Smart Suggestions")}
                            </span>
                            <span className="text-[9px] text-purple-400 italic">{uiText("components_screenplay_writer.span.click_to_insert", "Click to insert")}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            {smartSuggestions.map((sug, sIdx) => (
                              <CustomizableButton
                                buttonId="screenplay_writer_btn_5"
                                key={sIdx}
type="button"
onClick={() => {
                                  if (sug.speaker) setNewSpeaker(sug.speaker);
                                  setNewCaptionText(sug.text);
                                }}
className="text-left text-[11px] p-1.5 rounded-md bg-slate-900/80 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/50 text-slate-200 hover:text-white transition flex items-center justify-between group cursor-pointer"
                              >
                                  {() => (
                                      <>
                                        <span className="truncate flex-1">
                                  <strong className="text-cyan-400 mr-1.5">{sug.speaker}:</strong>
                                  "{sug.text}"
                                </span>
                                      <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-950/80 px-1 py-0.2 rounded border border-purple-800/50 ml-1.5 shrink-0">
                                  {sug.tag}
                                </span>
                                      </>
                                    )}
                              </CustomizableButton>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Genre / Tone Category Tabs */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                        {DIALOGUE_CATEGORIES.map((cat) => (
                          <CustomizableButton
                            buttonId="screenplay_writer_btn_4"
                            key={cat.id}
type="button"
onClick={() => setActiveCategory(cat.id)}
className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 shrink-0 transition cursor-pointer ${
                              activeCategory === cat.id
                                ? "bg-indigo-600 border-indigo-400 text-white shadow"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                              {() => (
                                  <>
                                    <span>{cat.icon}</span>
                                  <span>{cat.label}</span>
                                  </>
                                )}
                          </CustomizableButton>
                        ))}
                      </div>

                      {/* Dialogue Suggestion Chips for Selected Category */}
                      <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                        {DIALOGUE_CATEGORIES.find((c) => c.id === activeCategory)?.items.map((item, idx) => (
                          <CustomizableButton
                            buttonId="screenplay_writer_btn_3"
                            key={idx}
type="button"
onClick={() => {
                              if (item.speaker) setNewSpeaker(item.speaker);
                              setNewCaptionText(item.text);
                            }}
className="text-left text-[11px] p-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] hover:border-indigo-500/50 text-slate-300 hover:text-white transition flex items-center justify-between group cursor-pointer"
                          >
                              {() => (
                                  <>
                                    <span className="truncate flex-1">
                              {item.speaker && <strong className="text-cyan-400 mr-1.5">{item.speaker}:</strong>}
                              "{item.text}"
                            </span>
                                  <span className="text-[9px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold shrink-0 ml-1">
                              {uiText("components_screenplay_writer.span.use_line", "Use Line →")}
                            </span>
                                  </>
                                )}
                          </CustomizableButton>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply Bubbles / Dialogue Buttons */}
                {activeSlide.captions && activeSlide.captions.length > 0 && (
                  <div className="mt-1 space-y-2">
                    <CustomizableButton
                      buttonId="screenplay_writer_btn_2"
                      defaultIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      onClick={handleApplyBubblesToCurrent}
className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] uppercase font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
title={uiText("components_screenplay_writer.button.burn_dialogue_captions_into_the_current_fram.title", "Burn dialogue captions into the current frame")}
                    >
                        {() => (
                            <>
                              {uiText("components_screenplay_writer.button.save_to_current_frame", "Save to Current Frame")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="screenplay_writer_btn_1"
                      defaultIcon={<Plus className="w-4 h-4" />}
                      onClick={handleApplyBubbles}
className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] uppercase font-bold flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
title={uiText("components_screenplay_writer.button.create_a_duplicate_frame_with_burned_dialogu.title", "Create a duplicate frame with burned dialogue captions saved as a new frame")}
                    >
                        {() => (
                            <>
                              {uiText("components_screenplay_writer.button.save_to_new_frame", "Save to New Frame")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
