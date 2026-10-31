import React, { useState, useEffect, useRef } from "react";
import {
  Wand2, Image as ImageIcon, Sparkles, Upload, X, ArrowRight, Download, Plus,
  Loader2, Check, FileImage, Layers, Copy, Info, Maximize2, Mic, MicOff,
  Palette, Lightbulb, ChevronDown, Settings2, Edit3, MessageSquare, Trash2,
  Type, LayoutTemplate, Save, Film, Grid, Library, History, RotateCcw,
  Sun, Moon, PenTool, Clapperboard, UserPlus, BookOpen, Zap, Video, Mountain,
  Camera, Eye, SlidersHorizontal
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  MODIFIERS, DEFAULT_CHARACTERS, DEFAULT_SAVED_PROMPTS,
  type Modifier, type SavedPrompt, type SavedAsset, type Character,
  type BibleEntry, type TextOverlay, type PageLayout, type PanelConfig,
  type ParsedScriptPanel
} from "./imgdesc/types";
import { FrameShaperModal } from "./imgdesc/ShaperModal";
import { PageBuilderModal } from "./imgdesc/PageBuilderModal";
import { BibleModal } from "./imgdesc/BibleModal";
import { ScriptModal } from "./imgdesc/ScriptModal";
import { AvatarModal } from "./imgdesc/AvatarModal";
import { ImageMixerModal } from "./imgdesc/ImageMixerModal";
import { CaptionsModal, HeadersModal, TextLabModal } from "./imgdesc/TextModals";
import { DirectorArtistModal, GenreModal } from "./imgdesc/ModifierModals";
import { SavedPromptsModal, SavedAssetsModal, ThemeModal } from "./imgdesc/LibraryModals";
import {
  describeImage, generateImage, generateVariation, numberSubjects,
  appendImageDescription, suggestTrope, detectPanels
} from "../services/gemini";
import { useSpeechRecognition } from "../utils/useSpeechRecognition";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

const INITIAL_PANELS: PanelConfig[] = [
  { id: "frames", label: "Frames", icon: Settings2, color: "text-blue-400", buttons: ["Templates", "Frame Editor", "Page Builder", "Surprise Me"] },
  { id: "image", label: "Image", icon: ImageIcon, color: "text-emerald-400", buttons: ["Describe", "Replace", "Append", "Use Subject", "Edit", "Mixer"], colSpan: 2 },
  { id: "storyboard", label: "Storyboard", icon: LayoutTemplate, color: "text-pink-400", buttons: ["Page Builder", "Script 2 Prompt", "Frame Shaper", "Saved Assets", "Saved Prompts"] },
  { id: "modifiers", label: "Modifiers", icon: Layers, color: "text-orange-400", buttons: ["Genre", "Scene", "Style", "Directors", "Artists"] },
  { id: "fx", label: "FX", icon: Zap, color: "text-red-400", buttons: ["Vibe", "Stage", "Effects", "Camera", "Video"] },
  { id: "text", label: "Text", icon: MessageSquare, color: "text-sky-400", buttons: ["Captions", "Headers", "TextLab", "Typography"] },
  { id: "avatar", label: "Avatar", icon: UserPlus, color: "text-purple-400", buttons: ["Avatar Creator", "ID-Nr", "Subject Combine", "+Character"] },
  { id: "settings", label: "Settings", icon: SlidersHorizontal, color: "text-zinc-400", buttons: ["Theme", "Layout Reset", "Clear History", "Export Data", "Import Data"], colSpan: 3 },
];

const SortableAppPanel = ({ panel, children, appThemeColor }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: panel.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };

  const getColSpan = () => {
    if (panel.colSpan === 2) return "md:col-span-2";
    if (panel.colSpan === 3) return "md:col-span-3";
    return "";
  };

  return (
    <section ref={setNodeRef} style={style} className={`${getColSpan()} bg-zinc-900/40 border border-zinc-800 rounded-2xl p-2.5 flex flex-col gap-2 relative`}>
      <div className="flex items-center justify-between mb-0.5">
        <CustomizableLabel
          labelId="img_desc_studio_modal_item_49"
          as="h3"
          className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none"
        >
            {() => (
                <>
                  <panel.icon className={`w-3.5 h-3.5 ${panel.color}`} />
                {panel.label}
                </>
              )}
        </CustomizableLabel>
      </div>
      {children}
    </section>
  );
};

interface ImgDescStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToStoryboard: (name: string, url: string) => void;
  onSendToCarver: (url: string) => void;
  onSendToBox: (boxId: number, url: string) => void;
}

export const ImgDescStudioModal: React.FC<ImgDescStudioModalProps> = ({
  isOpen, onClose, onAddToStoryboard, onSendToCarver, onSendToBox
}) => {
  // Core generator states
  const [basePrompt, setBasePrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>(["cam-wide", "stg-neon"]);
  const [frameCount, setFrameCount] = useState<number>(4);
  const [largePanelPosition, setLargePanelPosition] = useState<"first" | "middle" | "last" | "none">("last");
  const [speechText, setSpeechText] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<number>(1);
  const [isPanelsVisible, setIsPanelsVisible] = useState(true);
  const [appThemeColor, setAppThemeColor] = useState("default");

  // Reference image state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consistency & Bible states
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const s = remoteStore.getItem("imgdesc_characters");
      return s ? JSON.parse(s) : DEFAULT_CHARACTERS;
    } catch { return DEFAULT_CHARACTERS; }
  });
  const [locations, setLocations] = useState<BibleEntry[]>(() => {
    try {
      const s = remoteStore.getItem("imgdesc_locations");
      return s ? JSON.parse(s) : [
        { id: "loc1", name: "Cyber Tokyo", type: "location", description: "Neon rain-slicked skyscrapers and holographic billboards.", timestamp: Date.now() }
      ];
    } catch { return []; }
  });

  // Text & Captions settings
  const [captions, setCaptions] = useState<{ speaker: string; text: string; panel?: string }[]>([
    { speaker: "", text: "", panel: "Panel 1" }
  ]);
  const [headersSettings, setHeadersSettings] = useState({
    enabled: false,
    headers: [{ text: "EPISODE 1", assignedFrames: "1" }],
    color: "#f50505",
    font: "Classic Comic",
    size: "medium",
  });
  const [textSettings, setTextSettings] = useState({
    font: "Classic Comic",
    color: "#00f0ff",
    size: "medium",
    assignment: "speech"
  });

  // Vector Speech Balloon & Action FX Overlays
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  // Manga Page Builder state
  const [pageLayout, setPageLayout] = useState<PageLayout>({
    id: "layout-default",
    name: "Classic Grid",
    rows: 2,
    cols: 2,
    margin: 8,
    borderColor: "#000000",
    panels: [
      { id: "p1", name: "Panel 1", row: 0, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
      { id: "p2", name: "Panel 2", row: 0, col: 1, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
      { id: "p3", name: "Panel 3", row: 1, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
      { id: "p4", name: "Panel 4", row: 1, col: 1, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
    ]
  });

  // Frame Shaper states
  const [shaperImage, setShaperImage] = useState<string | null>(null);
  const [detectedPanelsList, setDetectedPanelsList] = useState<any[]>([]);
  const [isDetectingPanels, setIsDetectingPanels] = useState(false);

  // Library & Storage states
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    try {
      const s = remoteStore.getItem("imgdesc_saved_prompts");
      return s ? JSON.parse(s) : DEFAULT_SAVED_PROMPTS;
    } catch { return DEFAULT_SAVED_PROMPTS; }
  });
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);

  // Sub-modal toggle states
  const [isShaperOpen, setIsShaperOpen] = useState(false);
  const [isPageBuilderOpen, setIsPageBuilderOpen] = useState(false);
  const [isBibleOpen, setIsBibleOpen] = useState(false);
  const [isScriptOpen, setIsScriptOpen] = useState(false);
  const [scriptText, setScriptText] = useState("");
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isCaptionsOpen, setIsCaptionsOpen] = useState(false);
  const [isHeadersOpen, setIsHeadersOpen] = useState(false);
  const [isTextLabOpen, setIsTextLabOpen] = useState(false);
  const [isDirectorOpen, setIsDirectorOpen] = useState(false);
  const [isArtistOpen, setIsArtistOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isSavedPromptsOpen, setIsSavedPromptsOpen] = useState(false);
  const [isSavedAssetsOpen, setIsSavedAssetsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Quick subject speech input
  const [quickSubNum, setQuickSubNum] = useState("1");
  const [quickSpeech, setQuickSpeech] = useState("");

  // Speech recognition
  const { isListening, startListening, stopListening } = useSpeechRecognition();
  const handleToggleMic = () => {
    if (isListening) stopListening();
    else {
      startListening((text) => setBasePrompt((prev) => `${prev} ${text}`.trim()));
    }
  };

  // Sync to local storage
  useEffect(() => {
    try {
      remoteStore.setItem("imgdesc_characters", JSON.stringify(characters));
      remoteStore.setItem("imgdesc_locations", JSON.stringify(locations));
      remoteStore.setItem("imgdesc_saved_prompts", JSON.stringify(savedPrompts));
    } catch {}
  }, [characters, locations, savedPrompts]);

  // Construct Final Prompt
  const replaceBibleTokens = (text: string) => {
    let result = text;
    characters.forEach((c) => {
      result = result.replace(new RegExp(`\\{character:${c.name}\\}`, "gi"), `${c.name}: ${c.description}`);
    });
    locations.forEach((l) => {
      result = result.replace(new RegExp(`\\{location:${l.name}\\}`, "gi"), `${l.name}: ${l.description}`);
    });
    return result;
  };

  const activeModifierValues = selectedModifiers.map((id) => MODIFIERS.find((m) => m.id === id)?.value).filter(Boolean);
  const captionsText = captions.filter((c) => c.text.trim()).map((c) => `In ${c.panel || "Panel 1"} ${c.speaker || "Character"} says "${c.text}"`).join(", ");

  const finaleString = largePanelPosition === "first" ? "Panel 1 is the large Finale intro panel, subsequent panels smaller"
    : largePanelPosition === "last" ? `First panels smaller, Panel ${frameCount} is the large Finale climax panel`
    : largePanelPosition === "middle" ? "Middle panel is an oversized centerpiece splash panel"
    : "All panels equal size";

  const finalPrompt = [
    `Text style: ${textSettings.font}, color: ${textSettings.color}, size: ${textSettings.size}, applied to: ${textSettings.assignment}`,
    replaceBibleTokens(basePrompt),
    speechText ? `Speech bubbles with: "${speechText}"` : "",
    captionsText ? `Include dialogue: ${captionsText}` : "",
    headersSettings.enabled && headersSettings.headers[0]?.text ? `Header title: "${headersSettings.headers[0].text}"` : "",
    ...activeModifierValues,
    `comic strip format, ${frameCount} panels, ${finaleString}. Never add the name to the panels.`
  ].filter(Boolean).join(", ");

  const handleGenerate = async () => {
    if (!finalPrompt.trim()) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const refImgs = referenceImage ? [{ base64Data: referenceImage, mimeType: "image/png" }] : undefined;
      const url = await generateImage(finalPrompt, refImgs, negativePrompt);
      setGeneratedImage(url);
    } catch (e: any) {
      setGenError(e.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNumberSubjects = async () => {
    if (!basePrompt.trim()) return;
    try {
      const numbered = await numberSubjects(basePrompt);
      setBasePrompt(numbered);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSuggestIdea = async () => {
    try {
      const idea = await suggestTrope();
      setBasePrompt(idea);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleOpenFrameShaper = async () => {
    if (!generatedImage) return;
    setShaperImage(generatedImage);
    setIsShaperOpen(true);
    setIsDetectingPanels(true);
    try {
      const panels = await detectPanels(generatedImage, "image/png");
      setDetectedPanelsList(panels);
    } finally {
      setIsDetectingPanels(false);
    }
  };

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [panelLayoutState, setPanelLayoutState] = useState<PanelConfig[]>(INITIAL_PANELS);

  const handleAppDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPanelLayoutState((items) => {
        const oldIndex = items.findIndex((p) => p.id === active.id);
        const newIndex = items.findIndex((p) => p.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-[96vw] h-[92vh] bg-[#090e1a] border border-[#1e293b] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1e293b] bg-[#020617]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="img_desc_studio_modal_item_48"
                  as="h2"
                  className="text-base font-bold text-slate-100"
                >
                    {() => (
                        <>
                          {uiText("components_img_desc_studio_modal.h2.imgdesc_studio_comixstripper_pro", "imgDesc Studio • ComixStripper Pro")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                  {uiText("components_img_desc_studio_modal.span.v8_0_engine", "v8.0 Engine")}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{uiText("components_img_desc_studio_modal.p.multi_panel_manga_layouts_speech_vector_fx_t", "Multi-Panel Manga Layouts • Speech Vector FX • Turnaround Animation")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="img_desc_studio_modal_btn_47"
              defaultIcon={<ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPanelsVisible ? "rotate-180" : ""}`} />}
              onClick={() => setIsPanelsVisible(!isPanelsVisible)}
className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5"
            >
                {() => (
                    <>
                      <span>{isPanelsVisible ? "Compact View" : "Show The Lab"}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="img_desc_studio_modal_btn_46"
              defaultIcon={<X className="w-5 h-5" />}
              onClick={onClose}
className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-zinc-800 transition"
title={uiText("components_img_desc_studio_modal.button.close.title", "Close")}
            />
          </div>
        </div>

        {/* Studio Content Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Reorderable Lab Panels */}
          {isPanelsVisible && (
            <div className="p-4 border border-blue-500/30 rounded-3xl bg-zinc-950/40">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Grid className="w-4 h-4 text-cyan-400" />{uiText("components_img_desc_studio_modal.span.studio_control_center_drag_panels_to_reorder", " Studio Control Center (Drag Panels to Reorder)")}
                </span>
              </div>
              <DndContext sensors={dndSensors} collisionDetection={closestCorners} onDragEnd={handleAppDragEnd}>
                <SortableContext items={panelLayoutState.map((p) => p.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {panelLayoutState.map((panel) => (
                      <SortableAppPanel key={panel.id} panel={panel} appThemeColor={appThemeColor}>
                        {panel.id === "frames" && (
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <CustomizableLabel
                                  labelId="img_desc_studio_modal_item_45"
                                  as="label"
                                  className="text-[10px] text-zinc-500"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_img_desc_studio_modal.label.frames", "Frames")}
                                        </>
                                      )}
                                </CustomizableLabel>
                                <input
                                  type="number" min="1" max="20"
                                  value={frameCount}
                                  onChange={(e) => setFrameCount(parseInt(e.target.value) || 4)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs"
                                />
                              </div>
                              <div>
                                <CustomizableLabel
                                  labelId="img_desc_studio_modal_item_44"
                                  as="label"
                                  className="text-[10px] text-zinc-500"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_img_desc_studio_modal.label.finale_pos", "Finale Pos")}
                                        </>
                                      )}
                                </CustomizableLabel>
                                <select
                                  value={largePanelPosition}
                                  onChange={(e) => setLargePanelPosition(e.target.value as any)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-1 py-1 text-xs"
                                >
                                  <option value="none">{uiText("components_img_desc_studio_modal.option.equal_size", "Equal Size")}</option>
                                  <option value="last">{uiText("components_img_desc_studio_modal.option.large_finale", "Large Finale")}</option>
                                  <option value="first">{uiText("components_img_desc_studio_modal.option.large_intro", "Large Intro")}</option>
                                  <option value="middle">{uiText("components_img_desc_studio_modal.option.large_center", "Large Center")}</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <CustomizableButton
                                buttonId="img_desc_studio_modal_btn_43"
                                onClick={() => setIsPageBuilderOpen(true)}
className="flex-1 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-[11px] font-semibold hover:bg-blue-500/20"
                              >
                                  {() => (
                                      <>
                                        {uiText("components_img_desc_studio_modal.button.page_builder", "Page Builder")}
                                      </>
                                    )}
                              </CustomizableButton>
                              <CustomizableButton
                                buttonId="img_desc_studio_modal_btn_42"
                                onClick={() => {
                                const styleMods = MODIFIERS.filter(m => m.category === "Styles");
                                const r = styleMods[Math.floor(Math.random() * styleMods.length)];
                                if (r) setSelectedModifiers(prev => [...prev.filter(id => !id.startsWith("sty")), r.id]);
                              }}
className="flex-1 py-1 bg-red-500/10 text-red-300 border border-red-500/20 rounded text-[11px] font-semibold hover:bg-red-500/20"
                              >
                                  {() => (
                                      <>
                                        {uiText("components_img_desc_studio_modal.button.surprise_me", "Surprise Me")}
                                      </>
                                    )}
                              </CustomizableButton>
                            </div>
                          </div>
                        )}

                        {panel.id === "image" && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {referenceImage ? (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 relative group shrink-0">
                                  <img src={referenceImage} alt={uiText("components_img_desc_studio_modal.img.ref.alt", "Ref")} className="w-full h-full object-cover" />
                                  <CustomizableButton
                                    buttonId="img_desc_studio_modal_btn_41"
                                    defaultIcon={<X className="w-4 h-4 text-red-400" />}
                                    onClick={() => setReferenceImage(null)}
className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  />
                                </div>
                              ) : (
                                <CustomizableButton
                                  buttonId="img_desc_studio_modal_btn_40"
                                  defaultIcon={<Upload className="w-4 h-4 text-emerald-400 mb-0.5" />}
                                  onClick={() => fileInputRef.current?.click()}
className="w-16 h-16 rounded-xl border border-dashed border-zinc-700 hover:border-emerald-500 flex flex-col items-center justify-center text-[10px] text-zinc-400 shrink-0"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_img_desc_studio_modal.button.upload", " Upload")}
                                        </>
                                      )}
                                </CustomizableButton>
                              )}
                              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  const r = new FileReader();
                                  r.onload = (ev) => typeof ev.target?.result === "string" && setReferenceImage(ev.target.result);
                                  r.readAsDataURL(f);
                                }
                              }} className="hidden" />

                              <div className="grid grid-cols-2 gap-1.5 flex-1 text-[11px]">
                                <CustomizableButton
                                  buttonId="img_desc_studio_modal_btn_39"
                                  onClick={async () => {
                                  if (!referenceImage) return;
                                  const d = await describeImage(referenceImage, "image/png");
                                  setBasePrompt(d);
                                }}
disabled={!referenceImage}
className="py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded font-semibold disabled:opacity-40"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_img_desc_studio_modal.button.describe", "Describe")}
                                        </>
                                      )}
                                </CustomizableButton>
                                <CustomizableButton
                                  buttonId="img_desc_studio_modal_btn_38"
                                  onClick={() => setIsMixerOpen(true)}
className="py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded font-semibold"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_img_desc_studio_modal.button.mixer", "Mixer")}
                                        </>
                                      )}
                                </CustomizableButton>
                                <CustomizableButton
                                  buttonId="img_desc_studio_modal_btn_37"
                                  onClick={() => setIsMixerOpen(true)}
className="py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 rounded font-semibold"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_img_desc_studio_modal.button.pinpoint", "Pinpoint")}
                                        </>
                                      )}
                                </CustomizableButton>
                                <CustomizableButton
                                  buttonId="img_desc_studio_modal_btn_36"
                                  onClick={() => fileInputRef.current?.click()}
className="py-1 bg-zinc-800 text-zinc-300 rounded font-semibold"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_img_desc_studio_modal.button.replace", "Replace")}
                                        </>
                                      )}
                                </CustomizableButton>
                              </div>
                            </div>
                          </div>
                        )}

                        {panel.id === "storyboard" && (
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_35"
                              onClick={() => setIsScriptOpen(true)}
className="py-1.5 bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded font-semibold hover:bg-pink-500/20"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.script_2_prompt", "Script 2 Prompt")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_34"
                              onClick={handleOpenFrameShaper}
disabled={!generatedImage}
className="py-1.5 bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 rounded font-semibold disabled:opacity-40"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.frame_shaper", "Frame Shaper")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_33"
                              onClick={() => setIsSavedAssetsOpen(true)}
className="py-1.5 bg-zinc-800 text-zinc-300 rounded font-semibold hover:bg-zinc-700"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.saved_assets", "Saved Assets")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_32"
                              onClick={() => setIsSavedPromptsOpen(true)}
className="py-1.5 bg-zinc-800 text-zinc-300 rounded font-semibold hover:bg-zinc-700"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.saved_prompts", "Saved Prompts")}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        )}

                        {panel.id === "modifiers" && (
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_31"
                              onClick={() => setIsGenreOpen(true)}
className="py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.genre", "Genre")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_30"
                              onClick={() => setIsDirectorOpen(true)}
className="py-1.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.directors", "Directors")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_29"
                              onClick={() => setIsArtistOpen(true)}
className="py-1.5 bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.artists", "Artists")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_28"
                              onClick={() => setSelectedModifiers([])}
className="py-1.5 bg-zinc-800 text-zinc-400 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.reset_mods", "Reset Mods")}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        )}

                        {panel.id === "fx" && (
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_27"
                              onClick={() => setSelectedModifiers(prev => [...prev, "stg-chiaroscuro", "cam-dutch"])}
className="py-1.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.cinematic_fx", "Cinematic FX")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_26"
                              onClick={() => setSelectedModifiers(prev => [...prev, "efx-speedlines"])}
className="py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.speed_lines", "Speed Lines")}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        )}

                        {panel.id === "text" && (
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_25"
                              onClick={() => setIsCaptionsOpen(true)}
className="py-1.5 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.captions", "Captions")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_24"
                              onClick={() => setIsHeadersOpen(true)}
className="py-1.5 bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.headers", "Headers")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_23"
                              onClick={() => setIsTextLabOpen(true)}
className="py-1.5 bg-zinc-800 text-zinc-300 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.textlab", "TextLab")}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        )}

                        {panel.id === "avatar" && (
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_22"
                              onClick={() => setIsAvatarOpen(true)}
className="py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.avatar_creator", "Avatar Creator")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_21"
                              onClick={handleNumberSubjects}
className="py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded font-semibold"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.id_nr", "ID-Nr [#]")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_20"
                              onClick={() => setIsBibleOpen(true)}
className="py-1.5 bg-zinc-800 text-zinc-300 rounded font-semibold col-span-2"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.character_and_location_bible", "+Character & Location Bible")}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        )}

                        {panel.id === "settings" && (
                          <div className="flex gap-2 text-[11px]">
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_19"
                              defaultIcon={<Palette className="w-3.5 h-3.5" />}
                              onClick={() => setIsThemeOpen(true)}
className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold flex items-center gap-1"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.theme", " Theme")}
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_18"
                              defaultIcon={<Download className="w-3.5 h-3.5" />}
                              onClick={() => {
                              const data = { characters, locations, savedPrompts, savedAssets };
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `comix-studio-backup-${Date.now()}.json`;
                              a.click();
                            }}
className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold flex items-center gap-1"
                            >
                                {() => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.button.export_data", " Export Data")}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        )}
                      </SortableAppPanel>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Idea Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <CustomizableLabel
                labelId="img_desc_studio_modal_item_17"
                defaultIcon={<Edit3 className="w-4 h-4 text-cyan-400" />}
                as="label"
                className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_img_desc_studio_modal.label.comic_strip_idea_and_scene_script", " Comic Strip Idea & Scene Script")}
                      </>
                    )}
              </CustomizableLabel>
              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="img_desc_studio_modal_btn_16"
                  defaultIcon={<Lightbulb className="w-3.5 h-3.5" />}
                  onClick={handleSuggestIdea}
className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                    {() => (
                        <>
                          {uiText("components_img_desc_studio_modal.button.suggest_trope", " Suggest Trope")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="img_desc_studio_modal_btn_15"
                  onClick={handleToggleMic}
className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-cyan-950 text-cyan-300 border border-cyan-800"}`}
                >
                    {() => (
                        <>
                          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        {isListening ? "Listening..." : "Dictate"}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="img_desc_studio_modal_btn_14"
                  onClick={() => setBasePrompt("")}
className="px-2 py-1 text-zinc-500 hover:text-red-400 text-xs"
                >
                    {() => (
                        <>
                          {uiText("components_img_desc_studio_modal.button.clear", "Clear")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            <textarea
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder={uiText("components_img_desc_studio_modal.textarea.e_g_in_neon_rain_slicked_neo_tokyo_1_cyra_in.placeholder", "e.g. In neon rain-slicked Neo-Tokyo, [1] Cyra in a chrome trench coat infiltrates an augmented cyber facility, dodging red sentry lasers...")}
              className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 resize-none font-medium leading-relaxed"
            />

            {/* Quick Add Speech Bubble */}
            <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs">
              <span className="text-emerald-400 font-bold whitespace-nowrap">{uiText("components_img_desc_studio_modal.span.speech_to_subject", "Speech to Subject:")}</span>
              <input
                type="text"
                value={quickSubNum}
                onChange={(e) => setQuickSubNum(e.target.value)}
                placeholder="1"
                className="w-12 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-center"
              />
              <input
                type="text"
                value={quickSpeech}
                onChange={(e) => setQuickSpeech(e.target.value)}
                placeholder={uiText("components_img_desc_studio_modal.input.what_do_they_say.placeholder", "What do they say?")}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-1 text-zinc-100"
              />
              <CustomizableButton
                buttonId="img_desc_studio_modal_btn_13"
                onClick={() => {
                  if (quickSpeech.trim()) {
                    setCaptions((prev) => [...prev, { speaker: `Subject [${quickSubNum}]`, text: quickSpeech, panel: "Panel 1" }]);
                    setQuickSpeech("");
                  }
                }}
className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold"
              >
                  {() => (
                      <>
                        {uiText("components_img_desc_studio_modal.button.add_dialogue", "Add Dialogue")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* Live Compiled Prompt Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{uiText("components_img_desc_studio_modal.span.final_prompt_preview", "Final Prompt Preview")}</span>
              <div className="flex gap-2">
                <CustomizableButton
                  buttonId="img_desc_studio_modal_btn_12"
                  defaultIcon={<Copy className="w-3 h-3" />}
                  onClick={() => navigator.clipboard.writeText(finalPrompt)}
className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                    {() => (
                        <>
                          {uiText("components_img_desc_studio_modal.button.copy_prompt", " Copy Prompt")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="img_desc_studio_modal_btn_11"
                  defaultIcon={<Save className="w-3 h-3" />}
                  onClick={() => {
                    const newPrompt: SavedPrompt = {
                      id: `prompt-${Date.now()}`,
                      name: `Prompt ${savedPrompts.length + 1}: ${basePrompt.slice(0, 24)}`,
                      basePrompt,
                      finalPrompt,
                      modifiers: selectedModifiers,
                      frameCount,
                      largePanelPosition,
                      timestamp: Date.now()
                    };
                    setSavedPrompts((prev) => [newPrompt, ...prev]);
                  }}
className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                    {() => (
                        <>
                          {uiText("components_img_desc_studio_modal.button.save_prompt", " Save Prompt")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[11px] font-mono text-zinc-400 max-h-24 overflow-y-auto leading-relaxed">
              {finalPrompt}
            </div>
          </div>

          {/* Generate Button */}
          <CustomizableButton
            buttonId="img_desc_studio_modal_btn_10"
            onClick={handleGenerate}
disabled={isGenerating || !finalPrompt.trim()}
className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:scale-[1.008] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/40 transition-all cursor-pointer"
          >
              {() => (
                  <>
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {isGenerating ? "Synthesizing Comic Strip..." : "Generate Comic Strip Artwork"}
                  </>
                )}
          </CustomizableButton>

          {genError && (
            <div className="p-3 bg-red-950/30 border border-red-500/30 text-red-300 text-xs rounded-xl font-medium">
              {genError}
            </div>
          )}

          {/* Generated Result & Interactive Overlay Canvas Stage */}
          {generatedImage && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-zinc-800">
              {/* Left Canvas with SVG Speech Balloons */}
              <div className="md:col-span-8 bg-zinc-950 rounded-2xl border border-zinc-800 p-4 flex items-center justify-center relative min-h-[420px] overflow-hidden select-none">
                <div className="relative inline-block max-h-[550px]">
                  <img src={generatedImage} alt={uiText("components_img_desc_studio_modal.img.comic_artwork.alt", "Comic Artwork")} className="max-h-[520px] max-w-full rounded-xl shadow-2xl object-contain select-none" />

                  {/* Render Vector Speech Balloons on top */}
                  {overlays.map((ov) => {
                    const isSelected = selectedOverlayId === ov.id;
                    return (
                      <div
                        key={ov.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOverlayId(ov.id);
                        }}
                        style={{
                          position: "absolute",
                          left: `${ov.x}%`,
                          top: `${ov.y}%`,
                          width: `${ov.width}%`,
                          height: `${ov.height}%`,
                          transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg) scale(${ov.scale || 1})`,
                          cursor: "move",
                          zIndex: isSelected ? 30 : 20,
                        }}
                        className={`absolute flex items-center justify-center p-2 select-none ${
                          isSelected ? "ring-2 ring-emerald-500 rounded-lg bg-emerald-500/10" : ""
                        }`}
                      >
                        {/* SVG Balloon Shapes */}
                        <div className="absolute inset-0 pointer-events-none">
                          {ov.type === "speech" && (
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                              <ellipse cx="50" cy="45" rx="48" ry="38" fill={ov.bgColor || "#ffffff"} stroke="#000000" strokeWidth="3" />
                              <polygon points="50,83 40,98 58,83" fill={ov.bgColor || "#ffffff"} stroke="#000000" strokeWidth="3" />
                              <ellipse cx="50" cy="45" rx="46" ry="36" fill={ov.bgColor || "#ffffff"} />
                            </svg>
                          )}
                          {ov.type === "thought" && (
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                              <ellipse cx="50" cy="45" rx="42" ry="34" fill={ov.bgColor || "#ffffff"} stroke="#000000" strokeWidth="3" />
                              <circle cx="20" cy="50" r="10" fill={ov.bgColor || "#ffffff"} stroke="#000000" strokeWidth="3" />
                              <circle cx="80" cy="50" r="10" fill={ov.bgColor || "#ffffff"} stroke="#000000" strokeWidth="3" />
                              <circle cx="35" cy="82" r="5" fill={ov.bgColor || "#ffffff"} stroke="#000000" strokeWidth="2" />
                            </svg>
                          )}
                          {ov.type === "scream" && (
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                              <polygon points="50,2 62,25 88,15 75,38 98,50 75,62 88,85 62,75 50,98 38,75 12,85 25,62 2,50 25,38 12,15 38,25" fill={ov.bgColor || "#fef08a"} stroke="#ef4444" strokeWidth="3.5" />
                            </svg>
                          )}
                          {ov.type === "action-fx" && (
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                              <polygon points="50,2 65,22 92,10 78,36 99,50 78,64 92,90 65,78 50,98 35,78 8,90 22,64 1,50 22,36 8,10 35,22" fill="#ef4444" stroke="#facc15" strokeWidth="4" />
                              <polygon points="50,6 63,24 88,14 75,38 94,50 75,62 88,86 63,76 50,94 37,76 12,86 25,62 6,50 25,38 12,14 37,24" fill="#facc15" />
                            </svg>
                          )}
                        </div>

                        <span
                          className="relative z-10 text-center font-bold px-2 pointer-events-none"
                          style={{
                            color: ov.color || "#000000",
                            fontSize: `${ov.fontSize || 12}px`,
                            textTransform: ov.type === "action-fx" ? "uppercase" : "none"
                          }}
                        >
                          {ov.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Action & Distribution Center */}
              <div className="md:col-span-4 flex flex-col justify-between space-y-4">
                {/* Speech Balloon Overlay Inspector */}
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />{uiText("components_img_desc_studio_modal.span.speech_and_action_fx_overlays", " Speech & Action FX Overlays")}
                    </span>
                    <CustomizableButton
                      buttonId="img_desc_studio_modal_btn_9"
                      onClick={() => {
                        const newOv: TextOverlay = {
                          id: `ov-${Date.now()}`,
                          type: "speech",
                          text: "Dialogue!",
                          x: 50, y: 35, width: 34, height: 22,
                          rotation: 0, scale: 1, fontSize: 12, color: "#000000", bgColor: "#ffffff"
                        };
                        setOverlays((prev) => [...prev, newOv]);
                        setSelectedOverlayId(newOv.id);
                      }}
className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                    >
                        {() => (
                            <>
                              {uiText("components_img_desc_studio_modal.button.add_balloon", "+ Add Balloon")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {selectedOverlayId && (() => {
                    const activeOv = overlays.find((o) => o.id === selectedOverlayId);
                    if (!activeOv) return null;
                    return (
                      <div className="space-y-2.5 p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
                        <div className="flex gap-1">
                          {(["speech", "thought", "scream", "action-fx"] as const).map((t) => (
                            <CustomizableButton
                              buttonId="img_desc_studio_modal_btn_8"
                              key={t}
onClick={() => setOverlays((prev) => prev.map((o) => o.id === selectedOverlayId ? { ...o, type: t } : o))}
className={`flex-1 py-1 rounded text-[10px] capitalize font-semibold ${activeOv.type === t ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
                            >
                                {() => (
                                    <>
                                      {t}
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>

                        <input
                          type="text"
                          value={activeOv.text}
                          onChange={(e) => setOverlays((prev) => prev.map((o) => o.id === selectedOverlayId ? { ...o, text: e.target.value } : o))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-100"
                        />

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <CustomizableLabel
                              labelId="img_desc_studio_modal_item_7"
                              defaultLabel={"%"}
                              as="label"
                              className="text-zinc-500 block"
                            >
                                {(ibcProps) => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.label.horiz", "Horiz: ")}
                                    {Math.round(activeOv.x)}
                                    {!ibcProps.isTextHidden ? ibcProps.label : null}
                                    </>
                                  )}
                            </CustomizableLabel>
                            <input type="range" min="0" max="100" value={activeOv.x} onChange={(e) => setOverlays((prev) => prev.map((o) => o.id === selectedOverlayId ? { ...o, x: parseFloat(e.target.value) } : o))} className="w-full accent-cyan-500" />
                          </div>
                          <div>
                            <CustomizableLabel
                              labelId="img_desc_studio_modal_item_6"
                              defaultLabel={"%"}
                              as="label"
                              className="text-zinc-500 block"
                            >
                                {(ibcProps) => (
                                    <>
                                      {uiText("components_img_desc_studio_modal.label.vert", "Vert: ")}
                                    {Math.round(activeOv.y)}
                                    {!ibcProps.isTextHidden ? ibcProps.label : null}
                                    </>
                                  )}
                            </CustomizableLabel>
                            <input type="range" min="0" max="100" value={activeOv.y} onChange={(e) => setOverlays((prev) => prev.map((o) => o.id === selectedOverlayId ? { ...o, y: parseFloat(e.target.value) } : o))} className="w-full accent-cyan-500" />
                          </div>
                        </div>

                        <CustomizableButton
                          buttonId="img_desc_studio_modal_btn_5"
                          onClick={() => {
                            setOverlays((prev) => prev.filter((o) => o.id !== selectedOverlayId));
                            setSelectedOverlayId(null);
                          }}
className="text-[10px] text-red-400 hover:underline"
                        >
                            {() => (
                                <>
                                  {uiText("components_img_desc_studio_modal.button.remove_this_balloon", "Remove This Balloon")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    );
                  })()}
                </div>

                {/* SeqCarver Workspace Distribution Bar */}
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    {uiText("components_img_desc_studio_modal.span.distribute_to_seqcarver_workspace", "Distribute to SeqCarver Workspace")}
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <CustomizableButton
                      buttonId="img_desc_studio_modal_btn_4"
                      defaultIcon={<Plus className="w-4 h-4" />}
                      onClick={() => {
                        onAddToStoryboard(`AI Comic Strip (${frameCount}P)`, generatedImage);
                        onClose();
                      }}
className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow"
                    >
                        {() => (
                            <>
                              {uiText("components_img_desc_studio_modal.button.add_to_storyboard", " Add to Storyboard")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="img_desc_studio_modal_btn_3"
                      defaultIcon={<Wand2 className="w-4 h-4" />}
                      onClick={() => {
                        onSendToCarver(generatedImage);
                        onClose();
                      }}
className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow"
                    >
                        {() => (
                            <>
                              {uiText("components_img_desc_studio_modal.button.load_to_carver", " Load to Carver")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold shrink-0">{uiText("components_img_desc_studio_modal.span.send_to_9_screen_box", "Send to 9-Screen Box:")}</span>
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => (
                        <CustomizableButton
                          buttonId="img_desc_studio_modal_btn_2"
                          key={b}
onClick={() => setSelectedBoxId(b)}
className={`w-6 h-6 rounded text-[10px] font-bold ${selectedBoxId === b ? "bg-cyan-500 text-black font-black" : "bg-zinc-800 text-zinc-300"}`}
                        >
                            {() => (
                                <>
                                  {b}
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>
                    <CustomizableButton
                      buttonId="img_desc_studio_modal_btn_1"
                      onClick={() => {
                        onSendToBox(selectedBoxId, generatedImage);
                        onClose();
                      }}
className="px-2.5 py-1 bg-cyan-500 text-black rounded text-[10px] font-bold"
                    >
                        {() => (
                            <>
                              {uiText("components_img_desc_studio_modal.button.send", "Send")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  <a
                    href={generatedImage}
                    download={`comix-strip-${Date.now()}.png`}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-4 h-4" />{uiText("components_img_desc_studio_modal.a.download_full_png", " Download Full PNG")}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-modals */}
      <FrameShaperModal
        isOpen={isShaperOpen}
        onClose={() => setIsShaperOpen(false)}
        shaperImage={shaperImage}
        detectedPanels={detectedPanelsList}
        setDetectedPanels={setDetectedPanelsList}
        isDetectingPanels={isDetectingPanels}
        onApplyShapedImage={async (instructions: string) => {
          const modPrompt = `${finalPrompt}\n[Layout Shaping]: ${instructions}`;
          const url = await generateImage(modPrompt);
          setGeneratedImage(url);
        }}
        onKeepImage={(img: string) => setGeneratedImage(img)}
      />

      <PageBuilderModal
        isOpen={isPageBuilderOpen}
        onClose={() => setIsPageBuilderOpen(false)}
        pageLayout={pageLayout}
        setPageLayout={setPageLayout}
        characters={characters}
        locations={locations}
        onExportPageToCanvas={(img) => setGeneratedImage(img)}
      />

      <BibleModal
        isOpen={isBibleOpen}
        onClose={() => setIsBibleOpen(false)}
        characters={characters}
        setCharacters={setCharacters}
        locations={locations}
        setLocations={setLocations}
        onInsertToken={(token) => setBasePrompt((prev) => `${prev} ${token}`.trim())}
      />

      <ScriptModal
        isOpen={isScriptOpen}
        onClose={() => setIsScriptOpen(false)}
        scriptText={scriptText}
        setScriptText={setScriptText}
        onApplyPrompt={(p) => setBasePrompt(p)}
        onApplyParsedPanelsToPageBuilder={(panels: ParsedScriptPanel[]) => {
          setPageLayout((prev) => ({
            ...prev,
            panels: panels.map((p, idx) => ({
              id: `p-${idx + 1}`,
              name: p.title || `Panel ${p.panelNumber}`,
              row: Math.floor(idx / 2),
              col: idx % 2,
              rowSpan: 1,
              colSpan: 1,
              aspectRatio: p.aspectRatio,
              prompt: p.prompt
            }))
          }));
          setIsPageBuilderOpen(true);
        }}
        onAddDialogueOverlay={(panel) => {
          if (panel.dialogue) {
            setOverlays((prev) => [
              ...prev,
              {
                id: `ov-${Date.now()}`,
                type: "speech",
                text: panel.dialogue!,
                x: 50, y: 35, width: 34, height: 22,
                rotation: 0, scale: 1, fontSize: 12, color: "#000000", bgColor: "#ffffff"
              }
            ]);
          }
        }}
      />

      <AvatarModal
        isOpen={isAvatarOpen}
        onClose={() => setIsAvatarOpen(false)}
        onSendToScripter={(d) => setBasePrompt((prev) => `${prev}\n${d}`.trim())}
        onSaveToCharacterManager={(name, desc, frame) => {
          setCharacters((prev) => [...prev, {
            id: `char-${Date.now()}`,
            name, description: desc, referenceImages: [frame], timestamp: Date.now()
          }]);
        }}
        onSendToCarverCanvas={(img) => {
          onSendToCarver(img);
          onClose();
        }}
      />

      <ImageMixerModal
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        onSendToCanvas={(img) => setGeneratedImage(img)}
        onSendToPrompt={(coords) => setBasePrompt((prev) => `${prev} ${coords}`.trim())}
      />

      <CaptionsModal
        isOpen={isCaptionsOpen}
        onClose={() => setIsCaptionsOpen(false)}
        captions={captions}
        setCaptions={setCaptions}
        frameCount={frameCount}
      />

      <HeadersModal
        isOpen={isHeadersOpen}
        onClose={() => setIsHeadersOpen(false)}
        headersSettings={headersSettings}
        setHeadersSettings={setHeadersSettings}
        frameCount={frameCount}
      />

      <TextLabModal
        isOpen={isTextLabOpen}
        onClose={() => setIsTextLabOpen(false)}
        textSettings={textSettings}
        setTextSettings={setTextSettings}
      />

      <DirectorArtistModal
        isOpen={isDirectorOpen}
        onClose={() => setIsDirectorOpen(false)}
        category="DirCut"
        selectedModifiers={selectedModifiers}
        setSelectedModifiers={setSelectedModifiers}
      />

      <DirectorArtistModal
        isOpen={isArtistOpen}
        onClose={() => setIsArtistOpen(false)}
        category="Artist"
        selectedModifiers={selectedModifiers}
        setSelectedModifiers={setSelectedModifiers}
      />

      <GenreModal
        isOpen={isGenreOpen}
        onClose={() => setIsGenreOpen(false)}
        selectedModifiers={selectedModifiers}
        setSelectedModifiers={setSelectedModifiers}
      />

      <SavedPromptsModal
        isOpen={isSavedPromptsOpen}
        onClose={() => setIsSavedPromptsOpen(false)}
        savedPrompts={savedPrompts}
        setSavedPrompts={setSavedPrompts}
        onLoadPrompt={(p: SavedPrompt) => {
          setBasePrompt(p.basePrompt);
          setSelectedModifiers(p.modifiers || []);
          if (p.frameCount) setFrameCount(p.frameCount);
          if (p.largePanelPosition) setLargePanelPosition(p.largePanelPosition);
        }}
      />

      <SavedAssetsModal
        isOpen={isSavedAssetsOpen}
        onClose={() => setIsSavedAssetsOpen(false)}
        savedAssets={savedAssets}
        setSavedAssets={setSavedAssets}
        onLoadAsset={(url: string) => setGeneratedImage(url)}
      />

      <ThemeModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        appThemeColor={appThemeColor}
        setAppThemeColor={setAppThemeColor}
      />
    </div>
  );
};
