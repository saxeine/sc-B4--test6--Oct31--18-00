import React, { useState } from "react";
import { History, Library, Palette, Info, X, Trash2, Check, Download, ArrowRight } from "lucide-react";
import type { SavedPrompt, SavedAsset } from "./types";
import { uiText } from "../../hooks/useUIConfig";
import { remoteStore } from "../../services/remoteKeyValueStore";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

export const SavedPromptsModal = ({
  isOpen, onClose, savedPrompts, setSavedPrompts, onLoadPrompt
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <CustomizableLabel
              labelId="imgdesc_library_modals_item_13"
              as="h2"
              className="text-base font-bold text-zinc-100"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_library_modals.h2.saved_prompts_library", "Saved Prompts Library")}
                    </>
                  )}
            </CustomizableLabel>
          </div>
          <CustomizableButton
            buttonId="imgdesc_library_modals_btn_12"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {savedPrompts.map((p: SavedPrompt) => (
            <div key={p.id} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 flex items-start justify-between gap-3 group hover:border-zinc-700 transition">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-indigo-300 block truncate">{p.name}</span>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed font-mono">{p.finalPrompt}</p>
                <div className="flex gap-2 mt-2 text-[9px] text-zinc-500">
                  <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{p.frameCount}{uiText("components_imgdesc_library_modals.span.panels", " panels")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <CustomizableButton
                  buttonId="imgdesc_library_modals_btn_11"
                  defaultIcon={<ArrowRight className="w-3 h-3" />}
                  onClick={() => {
                    onLoadPrompt(p);
                    onClose();
                  }}
className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_library_modals.button.load", " Load")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="imgdesc_library_modals_btn_10"
                  defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setSavedPrompts((prev: any[]) => prev.filter((item: any) => item.id !== p.id))}
className="p-1.5 text-zinc-600 hover:text-red-400 rounded hover:bg-zinc-800"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_library_modals_btn_9"
            onClick={onClose}
className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_library_modals.button.close", "Close")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};

export const SavedAssetsModal = ({
  isOpen, onClose, savedAssets, setSavedAssets, onLoadAsset
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-emerald-400" />
            <CustomizableLabel
              labelId="imgdesc_library_modals_item_8"
              as="h2"
              className="text-base font-bold text-zinc-100"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_library_modals.h2.saved_storyboard_assets_and_images", "Saved Storyboard Assets & Images")}
                    </>
                  )}
            </CustomizableLabel>
          </div>
          <CustomizableButton
            buttonId="imgdesc_library_modals_btn_7"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {savedAssets.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 italic">{uiText("components_imgdesc_library_modals.div.no_saved_assets_yet_save_creations_from_the", "No saved assets yet. Save creations from the image action bar.")}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {savedAssets.map((asset: SavedAsset) => (
                <div key={asset.id} className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex flex-col group">
                  <div className="aspect-square relative overflow-hidden bg-black/50">
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2 flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="truncate font-semibold">{asset.name}</span>
                    <CustomizableButton
                      buttonId="imgdesc_library_modals_btn_6"
                      defaultIcon={<Trash2 className="w-3 h-3" />}
                      onClick={() => setSavedAssets((prev: any[]) => prev.filter((item: any) => item.id !== asset.id))}
className="text-zinc-600 hover:text-red-400"
                    />
                  </div>
                  <CustomizableButton
                    buttonId="imgdesc_library_modals_btn_5"
                    onClick={() => {
                      onLoadAsset(asset.url);
                      onClose();
                    }}
className="w-full py-1.5 bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 text-[10px] font-bold text-center transition"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_library_modals.button.select_image", "Select Image")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_library_modals_btn_4"
            onClick={onClose}
className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_library_modals.button.close_2", "Close")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};

export const ThemeModal = ({
  isOpen, onClose, appThemeColor, setAppThemeColor
}: any) => {
  if (!isOpen) return null;

  const themes = [
    { id: "default", label: "Default Slate", color: "bg-zinc-600" },
    { id: "purple", label: "Cyber Violet", color: "bg-purple-500" },
    { id: "blue", label: "Neon Blue", color: "bg-blue-500" },
    { id: "emerald", label: "Emerald Matrix", color: "bg-emerald-500" },
    { id: "amber", label: "Solar Amber", color: "bg-amber-500" },
    { id: "rose", label: "Crimson Rose", color: "bg-rose-500" },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <CustomizableLabel
              labelId="imgdesc_library_modals_item_3"
              as="h2"
              className="text-base font-bold text-zinc-100"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_library_modals.h2.accent_theme", "Accent Theme")}
                    </>
                  )}
            </CustomizableLabel>
          </div>
          <CustomizableButton
            buttonId="imgdesc_library_modals_btn_2"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="p-5 grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <CustomizableButton
              buttonId="imgdesc_library_modals_btn_1"
              key={t.id}
onClick={() => {
                setAppThemeColor(t.id);
                remoteStore.setItem("appThemeColor", t.id);
                onClose();
              }}
className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition ${
                appThemeColor === t.id ? "border-white bg-white/10" : "border-zinc-800 hover:border-zinc-700 bg-zinc-950"
              }`}
            >
                {() => (
                    <>
                      <div className={`w-8 h-8 rounded-full ${t.color} shadow-lg`} />
                    <span className="text-xs font-semibold text-zinc-200">{t.label}</span>
                    </>
                  )}
            </CustomizableButton>
          ))}
        </div>
      </div>
    </div>
  );
};
