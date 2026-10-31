import React, { useState, useEffect, useCallback } from "react";
import { ShapeStudioIcon } from "./ShapeStudioIcon";
import { CustomizableButton } from "./CustomizableButton";
import { cn } from "../utils/cn";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ImageIcon,
  Scissors,
  Crop as CropIcon,
  Sparkles,
  MessageSquare,
  Focus,
} from "lucide-react";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";

interface ExpandViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slices: Array<{ name: string; url: string }>;
  currentIndex: number | null;
  onNavigate?: (newIndex: number) => void;
  customSlice?: { name: string; url: string } | null;
  onResendToCarve?: (url: string, name?: string) => void;
  onResendToCrop?: (url: string, sliceIndex?: number | null, customSlice?: { name: string; url: string } | null) => void;
  onOpenNeo1Studio?: (index: number) => void;
  onOpenBubba1Studio?: (index: number) => void;
  onOpenShapeStudio?: (index: number) => void;
  onOpenImageSharpener?: (url: string, name?: string, index?: number) => void;
  onOpenResampleStudio?: (url: string, name?: string, index?: number) => void;
  onOpenVariationsStudio?: (url: string, name?: string, index?: number) => void;
  onOpenZoomStudio?: (url: string, name?: string, index?: number) => void;
}

export const ExpandViewModal: React.FC<ExpandViewModalProps> = ({
  isOpen,
  onClose,
  slices,
  currentIndex,
  onNavigate,
  customSlice,
  onResendToCarve,
  onResendToCrop,
  onOpenNeo1Studio,
  onOpenBubba1Studio,
  onOpenShapeStudio,
  onOpenImageSharpener,
  onOpenResampleStudio,
  onOpenVariationsStudio,
  onOpenZoomStudio,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 1.5 = 150%, 2 = 200%, 0.5 = 50%
  const [isCopied, setIsCopied] = useState(false);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  // Determine active slice item
  const activeSlice =
    customSlice ||
    (currentIndex !== null && slices[currentIndex]
      ? slices[currentIndex]
      : null);

  const totalSlices = slices.length;
  const hasNavigation = currentIndex !== null && totalSlices > 1 && !customSlice;

  // Reset zoom and dimensions when slice changes
  useEffect(() => {
    setZoomLevel(1);
    setImgDimensions(null);
    setIsCopied(false);
  }, [currentIndex, customSlice?.url]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (hasNavigation && onNavigate && currentIndex !== null) {
        if (e.key === "ArrowLeft") {
          const prevIdx = (currentIndex - 1 + totalSlices) % totalSlices;
          onNavigate(prevIdx);
        } else if (e.key === "ArrowRight") {
          const nextIdx = (currentIndex + 1) % totalSlices;
          onNavigate(nextIdx);
        }
      }
    },
    [isOpen, onClose, hasNavigation, onNavigate, currentIndex, totalSlices]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !activeSlice) return null;

  const handleCopyName = () => {
    navigator.clipboard.writeText(activeSlice.name);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const a = document.createElement("a");
    a.href = activeSlice.url;
    a.download = `${activeSlice.name || "slice"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#0f172a]/90 border-b border-[#1e293b] shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <CustomizableLabel
              labelId="expand_view_modal_item_11"
              as="h3"
              className="text-sm font-bold text-slate-100 truncate flex items-center gap-2 animate-in fade-in duration-150"
title={activeSlice.name}
            >
                {() => (
                    <>
                      <span>{activeSlice.name || "Untitled Slice"}</span>
                    {hasNavigation && (
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 ml-1">
                  <CustomizableButton
                    buttonId="expand_view_modal_btn_10"
                    defaultIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    onClick={() => onNavigate && currentIndex !== null && onNavigate((currentIndex - 1 + totalSlices) % totalSlices)}
className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-md transition-all cursor-pointer"
title={uiText("components_expand_view_modal.button.previous_frame.title", "Previous Frame")}
                  />
                  <span className="text-xs font-mono px-1.5 text-slate-400 font-bold min-w-[50px] text-center">
                    #{currentIndex + 1} / {totalSlices}
                  </span>
                  <CustomizableButton
                    buttonId="expand_view_modal_btn_9"
                    defaultIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    onClick={() => onNavigate && currentIndex !== null && onNavigate((currentIndex + 1) % totalSlices)}
className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-md transition-all cursor-pointer"
title={uiText("components_expand_view_modal.button.next_frame.title", "Next Frame")}
                  />
                </div>
              )}
                    </>
                  )}
            </CustomizableLabel>
            {imgDimensions && (
              <p className="text-[11px] font-mono text-emerald-400">
                {uiText("components_expand_view_modal.p.original_resolution", "Original Resolution: ")}{imgDimensions.width} × {imgDimensions.height}{uiText("components_expand_view_modal.p.px", " px")}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#020617] border border-[#1e293b] rounded-lg p-0.5 text-xs">
            <CustomizableButton
              buttonId="expand_view_modal_btn_8"
              defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-[#0f172a] transition-colors cursor-pointer"
title={uiText("components_expand_view_modal.button.zoom_out.title", "Zoom Out")}
            />
            <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[45px] text-center font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <CustomizableButton
              buttonId="expand_view_modal_btn_7"
              defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-[#0f172a] transition-colors cursor-pointer"
title={uiText("components_expand_view_modal.button.zoom_in.title", "Zoom In")}
            />
            <CustomizableButton
              buttonId="expand_view_modal_btn_6"
              onClick={() => setZoomLevel(1)}
className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ml-1",
                zoomLevel === 1
                  ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              )}
title={uiText("components_expand_view_modal.button.fit_to_container.title", "Fit to Container")}
            >
                {() => (
                    <>
                      {uiText("components_expand_view_modal.button.fit", "Fit")}
                    </>
                  )}
            </CustomizableButton>
          </div>

          {onOpenNeo1Studio && currentIndex !== null && (
            <CustomizableButton
              buttonId="modal_expand_neo1"
              defaultLabel="Neo1 Studio"
              defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
              onClick={() => {
                onOpenNeo1Studio(currentIndex);
                onClose();
              }}
              className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border border-cyan-400/40 rounded-lg text-xs text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Neo1 Studio to design multi-layer graphics, text & effects on this slice"
            />
          )}

          {onOpenBubba1Studio && currentIndex !== null && (
            <CustomizableButton
              buttonId="modal_expand_bubba1"
              defaultLabel="Bubba 1"
              defaultIcon={<MessageSquare className="w-3.5 h-3.5 text-purple-200" />}
              onClick={() => {
                onOpenBubba1Studio(currentIndex);
                onClose();
              }}
              className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 rounded-lg text-xs text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Bubba1 Studio to add speech bubbles, thought clouds & narration overlays"
            />
          )}

          {onOpenShapeStudio && currentIndex !== null && (
            <CustomizableButton
              buttonId="modal_expand_shapestudio"
              defaultLabel="ShapeStudio"
              defaultIcon={<ShapeStudioIcon className="w-3.5 h-3.5 text-indigo-200" />}
              onClick={() => {
                onOpenShapeStudio(currentIndex);
                onClose();
              }}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 rounded-lg text-xs text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open ShapeStudio for geometric shapes, icons & freehand vector overlays"
            />
          )}

          {onOpenZoomStudio && activeSlice && (
            <CustomizableButton
              buttonId="modal_expand_zoom_studio"
              defaultLabel="Zoom studio"
              defaultIcon={<ZoomIn className="w-3.5 h-3.5 text-blue-300" />}
              onClick={() => {
                onOpenZoomStudio(
                  activeSlice.url,
                  activeSlice.name,
                  currentIndex ?? undefined
                );
                onClose();
              }}
              className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/40 rounded-lg text-xs text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Zoom Image Studio to generate user-defined zoom variations and cinematic effects"
            />
          )}

          {onOpenImageSharpener && activeSlice && (
            <CustomizableButton
              buttonId="modal_expand_sharpener"
              defaultLabel="Sharpener"
              defaultIcon={<Focus className="w-3.5 h-3.5 text-amber-300" />}
              onClick={() => {
                onOpenImageSharpener(
                  activeSlice.url,
                  activeSlice.name,
                  currentIndex ?? undefined
                );
                onClose();
              }}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border border-amber-400/40 rounded-lg text-xs text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Resolution Sharpener Studio to enhance clarity, sharpness, and upscale this image"
            />
          )}

          {onOpenResampleStudio && activeSlice && (
            <CustomizableButton
              buttonId="modal_expand_resample"
              defaultLabel="Resample HD"
              defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
              onClick={() => {
                onOpenResampleStudio(
                  activeSlice.url,
                  activeSlice.name,
                  currentIndex ?? undefined
                );
                onClose();
              }}
              className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 border border-cyan-400/40 rounded-lg text-xs text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Resample Studio to upscale resolution, fix graininess, and sharpen blur"
            />
          )}

          {(onResendToCrop || onResendToCarve) && activeSlice && (
            <CustomizableButton
              buttonId="modal_expand_resend_crop"
              defaultLabel="Resend to Crop"
              defaultIcon={<Scissors className="w-3.5 h-3.5 text-[#10b981]" />}
              onClick={() => {
                if (onResendToCrop) {
                  onResendToCrop(activeSlice.url, currentIndex, customSlice);
                } else if (onResendToCarve) {
                  onResendToCarve(activeSlice.url, activeSlice.name);
                }
                onClose();
              }}
              className="px-2.5 py-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-[#10b981]/50 rounded-lg text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Resend this frame to Crop mode"
            />
          )}

          <CustomizableButton
            buttonId="expand_view_modal_btn_5"
            onClick={handleCopyName}
className="px-2.5 py-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-slate-700 rounded-lg text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
title={uiText("components_expand_view_modal.button.copy_slice_name.title", "Copy slice name")}
          >
              {() => (
                  <>
                    {isCopied ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{isCopied ? "Copied" : "Copy Name"}</span>
                  </>
                )}
          </CustomizableButton>

          <CustomizableButton
            buttonId="modal_expand_download"
            defaultLabel="Download"
            defaultIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownloadSingle}
            className="px-2.5 py-1.5 bg-[#10b981] hover:bg-emerald-400 text-[#020617] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Download full resolution slice image"
          />

          <div className="w-px h-6 bg-[#1e293b] mx-1" />

          <CustomizableButton
            buttonId="modal_expand_close"
            defaultLabel=""
            forceZeroText={true}
            defaultIcon={<X className="w-4 h-4" />}
            onClick={onClose}
            className="p-1.5 bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Close view (Esc)"
          />
        </div>
      </div>

      {/* Main Preview Area */}
      <div
        className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+CjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNzA1MTIiIC8+CjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNzA1MTIiIC8+Cjwvc3ZnPg==\")",
        }}
      >
        {/* Floating Quick Actions inside preview area */}
        {activeSlice && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {onOpenZoomStudio && (
              <CustomizableButton
                buttonId="modal_expand_preview_zoom_studio"
                defaultLabel="Zoom studio"
                defaultIcon={<ZoomIn className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />}
                onClick={() => {
                  onOpenZoomStudio(
                    activeSlice.url,
                    activeSlice.name,
                    currentIndex ?? undefined
                  );
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-slate-950/90 hover:bg-blue-950/95 text-blue-300 hover:text-blue-200 border border-blue-500/50 hover:border-blue-400 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 group ring-1 ring-blue-500/20"
                title="Open Zoom Image Studio: Generate user defined zoom variations and optical effects"
              />
            )}

            {onOpenVariationsStudio && (
              <CustomizableButton
                buttonId="modal_expand_preview_variations"
                defaultLabel="Variations Studio"
                defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />}
                onClick={() => {
                  onOpenVariationsStudio(
                    activeSlice.url,
                    activeSlice.name,
                    currentIndex ?? undefined
                  );
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-slate-950/90 hover:bg-cyan-950/95 text-cyan-300 hover:text-cyan-200 border border-cyan-500/50 hover:border-cyan-400 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 group ring-1 ring-cyan-500/20"
                title="Open Variations Image Studio: Motion illusion, Zoom, Color & Multi-FX Series"
              />
            )}

            {onOpenImageSharpener && (
              <CustomizableButton
                buttonId="modal_expand_preview_sharpener"
                defaultLabel="Resolution Sharpener"
                defaultIcon={<Focus className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />}
                onClick={() => {
                  onOpenImageSharpener(
                    activeSlice.url,
                    activeSlice.name,
                    currentIndex ?? undefined
                  );
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-slate-950/90 hover:bg-amber-950/95 text-amber-300 hover:text-amber-200 border border-amber-500/50 hover:border-amber-400 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 group ring-1 ring-amber-500/20"
                title="Open Resolution Sharpener Studio to enhance resolution, clarity & upscale this image"
              />
            )}

            {onOpenResampleStudio && (
              <CustomizableButton
                buttonId="modal_expand_preview_resample"
                defaultLabel="Resample Studio"
                defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />}
                onClick={() => {
                  onOpenResampleStudio(
                    activeSlice.url,
                    activeSlice.name,
                    currentIndex ?? undefined
                  );
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-slate-950/90 hover:bg-cyan-950/95 text-cyan-300 hover:text-cyan-200 border border-cyan-500/50 hover:border-cyan-400 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 group ring-1 ring-cyan-500/20"
                title="Open Resample Studio to upscale resolution, eliminate graininess & fix blur"
              />
            )}
          </div>
        )}

        {/* Navigation Arrow Left */}
        {hasNavigation && onNavigate && currentIndex !== null && (
          <CustomizableButton
            buttonId="expand_view_modal_btn_4"
            defaultIcon={<ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />}
            onClick={() => onNavigate((currentIndex - 1 + totalSlices) % totalSlices)}
className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-[#10b981] hover:border-[#10b981] transition-all shadow-2xl cursor-pointer group"
title={uiText("components_expand_view_modal.button.previous_slice_left_arrow.title", "Previous slice (Left Arrow)")}
          />
        )}

        {/* Navigation Arrow Right */}
        {hasNavigation && onNavigate && currentIndex !== null && (
          <CustomizableButton
            buttonId="expand_view_modal_btn_3"
            defaultIcon={<ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />}
            onClick={() => onNavigate((currentIndex + 1) % totalSlices)}
className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-[#10b981] hover:border-[#10b981] transition-all shadow-2xl cursor-pointer group"
title={uiText("components_expand_view_modal.button.next_slice_right_arrow.title", "Next slice (Right Arrow)")}
          />
        )}

        {/* Image Display */}
        <div className="flex items-center justify-center max-w-full max-h-full transition-transform duration-150">
          <img
            src={activeSlice.url}
            alt={activeSlice.name}
            onLoad={(e) => {
              setImgDimensions({
                width: e.currentTarget.naturalWidth,
                height: e.currentTarget.naturalHeight,
              });
            }}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
            }}
            className="max-w-[85vw] max-h-[78vh] object-contain rounded-lg border border-slate-800 shadow-2xl transition-transform"
          />
        </div>
      </div>

      {/* Bottom Footer Info Bar */}
      <div
        className="px-4 py-2 bg-[#0f172a]/90 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span className="hidden sm:inline">{uiText("components_expand_view_modal.span.original_full_resolution_inspection_mode", "Original Full Resolution Inspection Mode")}</span>
            <span className="sm:hidden">{uiText("components_expand_view_modal.span.full_resolution", "Full Resolution")}</span>
          </span>
          {hasNavigation && (
            <span className="hidden lg:inline-block text-slate-500">
              {uiText("components_expand_view_modal.span.use", "Use ")}<kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">←</kbd>{uiText("components_expand_view_modal.span.and", " and ")}<kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">→</kbd>{uiText("components_expand_view_modal.span.keys", " keys")}
            </span>
          )}
        </div>

        {/* Dynamic Footer Progress Buttons */}
        {hasNavigation && onNavigate && currentIndex !== null && (
          <div className="flex items-center gap-2 bg-[#020617] border border-slate-850 rounded-lg p-0.5 mx-auto animate-in fade-in zoom-in-95 duration-200">
            <CustomizableButton
              buttonId="expand_view_modal_btn_2"
              defaultIcon={<ChevronLeft className="w-4 h-4" />}
              onClick={() => onNavigate((currentIndex - 1 + totalSlices) % totalSlices)}
className="px-3 py-1 text-slate-300 hover:text-emerald-400 rounded-md hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-xs active:scale-95"
title={uiText("components_expand_view_modal.button.previous_frame.title_2", "Previous Frame")}
            >
                {() => (
                    <>
                      <span>{uiText("components_expand_view_modal.span.back", "Back")}</span>
                    </>
                  )}
            </CustomizableButton>
            <span className="px-3 font-mono text-[11px] text-slate-400 font-bold border-l border-r border-slate-850 min-w-[55px] text-center">
              {currentIndex + 1} / {totalSlices}
            </span>
            <CustomizableButton
              buttonId="expand_view_modal_btn_1"
              defaultIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => onNavigate((currentIndex + 1) % totalSlices)}
className="px-3 py-1 text-slate-300 hover:text-emerald-400 rounded-md hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-xs active:scale-95"
title={uiText("components_expand_view_modal.button.next_frame.title_2", "Next Frame")}
            >
                {() => (
                    <>
                      <span>{uiText("components_expand_view_modal.span.next", "Next")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        )}

        <div className="flex items-center justify-end flex-1">
          <div className="text-[11px] text-slate-500 font-medium">
            {uiText("components_expand_view_modal.div.press", "Press ")}<kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">{uiText("components_expand_view_modal.kbd.esc", "Esc")}</kbd>{uiText("components_expand_view_modal.div.to_exit", " to exit")}
          </div>
        </div>
      </div>
    </div>
  );
};
