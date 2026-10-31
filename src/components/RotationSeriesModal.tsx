import React from "react";
import {
  X,
  RotateCw,
  Play,
  Pause,
  Upload,
  Trash2,
  Sparkles,
  Plus,
  Clock,
  ImagePlus,
  Grid3x3,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

interface RotationSeriesModalProps {
  boxId: number;
  isOpen: boolean;
  onClose: () => void;
  series: string[];
  interval: number;
  isActive: boolean;
  onUpdateConfig: (series: string[], interval: number, active: boolean) => void;
  currentBoxImage: string;
  storyboardSlices: { name: string; url: string }[];
  onSpreadImages?: (series: string[]) => void;
}

export type ModalSizeOption = "sm" | "md" | "lg" | "xl";

export function RotationSeriesModal({
  boxId,
  isOpen,
  onClose,
  series,
  interval,
  isActive,
  onUpdateConfig,
  currentBoxImage,
  storyboardSlices,
  onSpreadImages,
}: RotationSeriesModalProps) {
  const [modalSize, setModalSize] = React.useState<ModalSizeOption>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_rotation_modal_size");
      if (saved === "sm" || saved === "md" || saved === "lg" || saved === "xl") {
        return saved;
      }
    } catch (e) {
      // fallback
    }
    return "lg";
  });

  const handleSizeChange = (size: ModalSizeOption) => {
    setModalSize(size);
    try {
      remoteStore.setItem("seqcarver_rotation_modal_size", size);
    } catch (e) {
      // ignore
    }
  };

  if (!isOpen) return null;

  const handleMultipleUploads = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newUrls: string[] = [];

    let loadedCount = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result?.toString();
        if (url) newUrls.push(url);
        loadedCount++;
        if (loadedCount === files.length) {
          onUpdateConfig([...series, ...newUrls], interval, isActive);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddCurrentImage = () => {
    if (!currentBoxImage) return;
    if (series.includes(currentBoxImage)) return;
    onUpdateConfig([...series, currentBoxImage], interval, isActive);
  };

  const handleAddStoryboardSlices = () => {
    const sliceUrls = storyboardSlices.map((s) => s.url).filter(Boolean);
    if (sliceUrls.length === 0) return;
    const filtered = sliceUrls.filter((url) => !series.includes(url));
    onUpdateConfig([...series, ...filtered], interval, isActive);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = series.filter((_, idx) => idx !== indexToRemove);
    onUpdateConfig(updated, interval, updated.length > 0 ? isActive : false);
  };

  const handleClearAll = () => {
    onUpdateConfig([], interval, false);
  };

  const presetIntervals = [1, 2, 3, 5, 10, 15, 30];

  const sizeWidthMap: Record<ModalSizeOption, string> = {
    sm: "max-w-lg",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn(
        "bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 transition-all",
        sizeWidthMap[modalSize]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300">
              <RotateCw className={cn("w-5 h-5", isActive && "animate-spin")} />
            </div>
            <div>
              <CustomizableLabel
                labelId="rotation_series_modal_item_13"
                as="h3"
                className="text-base font-extrabold text-slate-100 flex items-center gap-2"
              >
                  {() => (
                      <>
                        <span>{uiText("components_rotation_series_modal.span.box", "Box ")}{boxId}{uiText("components_rotation_series_modal.span.image_series_rotation", " Image Series Rotation")}</span>
                      {isActive && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {uiText("components_rotation_series_modal.span.active", "Active (")}{interval}{uiText("components_rotation_series_modal.span.s", "s)")}
                  </span>
                )}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">
                {uiText("components_rotation_series_modal.p.automatically_rotate_through_a_series_of_ima", "Automatically rotate through a series of images over your defined time period")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Modal Size Selector Controls */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg">
              {(["sm", "md", "lg", "xl"] as ModalSizeOption[]).map((size) => (
                <CustomizableButton
                  buttonId="rotation_series_modal_btn_12"
                  key={size}
type="button"
onClick={() => handleSizeChange(size)}
className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer",
                    modalSize === size
                      ? "bg-purple-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  )}
title={`Modal size: ${size.toUpperCase()}${size === "lg" ? " (Default)" : ""}`}
                >
                    {() => (
                        <>
                          {size}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>

            <CustomizableButton
              buttonId="rotation_series_modal_btn_11"
              defaultIcon={<X className="w-5 h-5" />}
              type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
title={uiText("components_rotation_series_modal.button.close.title", "Close")}
            />
          </div>
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#020617] p-3 rounded-xl border border-slate-800">
          {/* User defined Period / Interval */}
          <div className="flex flex-col gap-1.5">
            <CustomizableLabel
              labelId="rotation_series_modal_item_10"
              defaultIcon={<Clock className="w-3.5 h-3.5 text-purple-400" />}
              as="label"
              className="text-[11px] font-bold text-slate-300 flex items-center gap-1"
            >
                {() => (
                    <>
                      <span>{uiText("components_rotation_series_modal.span.rotation_period_seconds", "Rotation Period (Seconds)")}</span>
                    </>
                  )}
            </CustomizableLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={3600}
                value={interval}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  onUpdateConfig(series, val, isActive);
                }}
                className="w-20 bg-[#0f172a] border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-100 text-center focus:outline-none focus:border-purple-500"
              />
              <span className="text-xs text-slate-400 font-semibold">{uiText("components_rotation_series_modal.span.seconds", "seconds")}</span>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1 flex-wrap mt-1">
              <span className="text-[10px] text-slate-500">{uiText("components_rotation_series_modal.span.presets", "Presets:")}</span>
              {presetIntervals.map((sec) => (
                <CustomizableButton
                  buttonId="rotation_series_modal_btn_9"
                  key={sec}
type="button"
onClick={() => onUpdateConfig(series, sec, isActive)}
className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border",
                    interval === sec
                      ? "bg-purple-500/30 text-purple-300 border-purple-400/60"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          {sec}
                        {uiText("components_rotation_series_modal.button.s", "s")}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
          </div>

          {/* Toggle Rotation Status */}
          <div className="flex flex-col justify-between gap-2 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3">
            <span className="text-[11px] font-bold text-slate-300">{uiText("components_rotation_series_modal.span.rotation_status", "Rotation Status")}</span>
            <div className="flex items-center gap-2">
              <CustomizableButton
                buttonId="rotation_series_modal_btn_8"
                type="button"
onClick={() => onUpdateConfig(series, interval, !isActive)}
disabled={series.length === 0}
className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer border",
                  series.length === 0
                    ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                    : isActive
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30"
                )}
              >
                  {() => (
                      <>
                        {isActive ? (
                  <>
                    <Pause className="w-4 h-4 text-rose-400 fill-current" />
                    <span>{uiText("components_rotation_series_modal.span.pause_rotation", "Pause Rotation")}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-400 fill-current" />
                    <span>{uiText("components_rotation_series_modal.span.start_rotation", "Start Rotation (")}{series.length}{uiText("components_rotation_series_modal.span.images", " images)")}</span>
                  </>
                )}
                      </>
                    )}
              </CustomizableButton>
            </div>
            {series.length === 0 && (
              <p className="text-[10px] text-amber-400/90 italic">
                {uiText("components_rotation_series_modal.p.add_at_least_one_image_below_to_enable_rotat", "Add at least one image below to enable rotation.")}
              </p>
            )}
          </div>
        </div>

        {/* Add Images Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap bg-[#020617]/50 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Upload Files */}
            <CustomizableLabel
              labelId="rotation_series_modal_item_7"
              defaultIcon={<ImagePlus className="w-3.5 h-3.5 text-purple-300" />}
              as="label"
              className="bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border border-purple-400/40 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
                {() => (
                    <>
                      <span>{uiText("components_rotation_series_modal.span.upload_images", "Upload Images")}</span>
                    <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleMultipleUploads}
                className="hidden"
              />
                    </>
                  )}
            </CustomizableLabel>

            {/* Add Current Box Image */}
            {currentBoxImage && !series.includes(currentBoxImage) && (
              <CustomizableButton
                buttonId="rotation_series_modal_btn_6"
                defaultIcon={<Plus className="w-3.5 h-3.5" />}
                type="button"
onClick={handleAddCurrentImage}
className="bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-400/40 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                  {() => (
                      <>
                        <span>{uiText("components_rotation_series_modal.span.add_box", "Add Box ")}{boxId}{uiText("components_rotation_series_modal.span.current_image", " Current Image")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}

            {/* Add Storyboard Slices */}
            {storyboardSlices.length > 0 && (
              <CustomizableButton
                buttonId="rotation_series_modal_btn_5"
                defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
                type="button"
onClick={handleAddStoryboardSlices}
className="bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-400/40 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                  {() => (
                      <>
                        <span>{uiText("components_rotation_series_modal.span.add_all_storyboard_slices", "Add All Storyboard Slices (")}{storyboardSlices.length})</span>
                      </>
                    )}
              </CustomizableButton>
            )}
          </div>

          <div className="flex items-center gap-2">
            {series.length > 0 && onSpreadImages && (
              <CustomizableButton
                buttonId="rotation_series_modal_btn_4"
                defaultIcon={<Grid3x3 className="w-3.5 h-3.5" />}
                type="button"
onClick={() => {
                  onSpreadImages(series);
                  onClose();
                }}
className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                  {() => (
                      <>
                        <span>{uiText("components_rotation_series_modal.span.spread_and_rotate_9_slots", "Spread & Rotate (9 Slots)")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}
            {series.length > 0 && (
              <CustomizableButton
                buttonId="rotation_series_modal_btn_3"
                defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                type="button"
onClick={handleClearAll}
className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                  {() => (
                      <>
                        <span>{uiText("components_rotation_series_modal.span.clear_series", "Clear Series")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}
          </div>
        </div>

        {/* Series Images Grid */}
        <div className="max-h-72 overflow-y-auto pr-1">
          {series.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {series.map((url, idx) => (
                <div
                  key={`series-img-${idx}-${url.slice(0, 30)}`}
                  className="group relative bg-[#020617] border border-slate-800 hover:border-purple-500/60 rounded-xl p-1.5 flex flex-col items-center gap-1 shadow-md transition-all"
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={url}
                      alt={`Series image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Frame Index Badge */}
                    <div className="absolute top-1 left-1 bg-slate-950/80 text-slate-200 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md border border-slate-700">
                      #{idx + 1}
                    </div>

                    {/* Delete button overlay */}
                    <CustomizableButton
                      buttonId="rotation_series_modal_btn_2"
                      defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                      type="button"
onClick={() => handleRemoveImage(idx)}
className="absolute top-1 right-1 p-1 bg-rose-950/90 text-rose-300 hover:bg-rose-600 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
title={uiText("components_rotation_series_modal.button.remove_image_from_series.title", "Remove image from series")}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-[#020617] rounded-xl border border-slate-800/80 gap-2">
              <RotateCw className="w-8 h-8 text-purple-400/40" />
              <span className="text-xs font-bold text-slate-300">{uiText("components_rotation_series_modal.span.no_series_images_uploaded", "No Series Images Uploaded")}</span>
              <p className="text-[11px] text-slate-500 max-w-sm">
                {uiText("components_rotation_series_modal.p.upload_local_files_add_the_current_box_image", "Upload local files, add the current box image, or pull slices from the Storyboard to form an automated rotating slideshow for Box ")}{boxId}!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">
            {series.length}{uiText("components_rotation_series_modal.span.image", " image")}{series.length === 1 ? "" : "s"}{uiText("components_rotation_series_modal.span.in_rotation_series", " in rotation series")}
          </span>
          <CustomizableButton
            buttonId="rotation_series_modal_btn_1"
            type="button"
onClick={onClose}
className="px-5 py-1.5 bg-[#10b981] hover:bg-[#10b981]/80 text-[#020617] text-xs font-extrabold rounded-xl transition-colors cursor-pointer shadow-sm"
          >
              {() => (
                  <>
                    {uiText("components_rotation_series_modal.button.done", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
}
