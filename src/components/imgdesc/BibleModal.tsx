import React, { useState } from "react";
import { BookOpen, X, Plus, Trash2, Edit3, Image as ImageIcon } from "lucide-react";
import type { Character, BibleEntry } from "./types";
import { uiText } from "../../hooks/useUIConfig";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

interface BibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  locations: BibleEntry[];
  setLocations: React.Dispatch<React.SetStateAction<BibleEntry[]>>;
  onInsertToken: (token: string) => void;
}

export const BibleModal: React.FC<BibleModalProps> = ({
  isOpen, onClose, characters, setCharacters, locations, setLocations, onInsertToken
}) => {
  const [activeTab, setActiveTab] = useState<"characters" | "locations">("characters");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddCharacter = () => {
    if (!name.trim()) return;
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      referenceImages: images,
      timestamp: Date.now(),
    };
    setCharacters((prev) => [...prev, newChar]);
    setName("");
    setDescription("");
    setImages([]);
  };

  const handleAddLocation = () => {
    if (!name.trim()) return;
    const newLoc: BibleEntry = {
      id: `loc-${Date.now()}`,
      name: name.trim(),
      type: "location",
      description: description.trim(),
      timestamp: Date.now(),
    };
    setLocations((prev) => [...prev, newLoc]);
    setName("");
    setDescription("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="imgdesc_bible_modal_item_13"
                as="h2"
                className="text-base font-bold text-zinc-100"
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_bible_modal.h2.character_and_location_consistency_bible", "Character & Location Consistency Bible")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[11px] text-zinc-400">{uiText("components_imgdesc_bible_modal.p.lock_persistent_traits_wardrobes_and_environ", "Lock persistent traits, wardrobes, and environments across all panels")}</p>
            </div>
          </div>
          <CustomizableButton
            buttonId="imgdesc_bible_modal_btn_12"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        {/* Tab buttons */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1">
          <CustomizableButton
            buttonId="imgdesc_bible_modal_btn_11"
            defaultLabel={")"}
            onClick={() => setActiveTab("characters")}
className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "characters" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
              {(ibcProps) => (
                  <>
                    {uiText("components_imgdesc_bible_modal.button.characters", "Characters (")}
                  {characters.length}
                  {!ibcProps.isTextHidden ? ibcProps.label : null}
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="imgdesc_bible_modal_btn_10"
            defaultLabel={")"}
            onClick={() => setActiveTab("locations")}
className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "locations" ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
              {(ibcProps) => (
                  <>
                    {uiText("components_imgdesc_bible_modal.button.locations", "Locations (")}
                  {locations.length}
                  {!ibcProps.isTextHidden ? ibcProps.label : null}
                  </>
                )}
          </CustomizableButton>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Add form */}
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <CustomizableLabel
              labelId="imgdesc_bible_modal_item_9"
              as="h3"
              className="text-xs uppercase font-bold text-zinc-400 tracking-wider"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_bible_modal.h3.add_new", "Add New ")}
                    {activeTab === "characters" ? "Character" : "Location"}
                    </>
                  )}
            </CustomizableLabel>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={activeTab === "characters" ? "Character Name (e.g. Maya)" : "Location Name (e.g. Cyber City Rooftop)"}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={uiText("components_imgdesc_bible_modal.textarea.detailed_visual_description_hair_color_cloth.placeholder", "Detailed visual description (hair color, clothing, distinctive markings, lighting, architectural details)...")}
              className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
            />

            {activeTab === "characters" && (
              <div>
                <CustomizableLabel
                  labelId="imgdesc_bible_modal_item_8"
                  defaultIcon={<ImageIcon className="w-3 h-3 text-emerald-400" />}
                  as="label"
                  className="text-[10px] text-zinc-400 font-bold uppercase block mb-1.5 flex items-center gap-1"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_bible_modal.label.reference_photos", " Reference Photos")}
                        </>
                      )}
                </CustomizableLabel>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="text-[10px] text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:bg-zinc-800 file:text-zinc-200 file:border-0" />
                {images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {images.map((img, i) => (
                      <img key={i} src={img} alt={uiText("components_imgdesc_bible_modal.img.ref.alt", "Ref")} className="w-10 h-10 object-cover rounded-lg border border-zinc-700" />
                    ))}
                  </div>
                )}
              </div>
            )}

            <CustomizableButton
              buttonId="imgdesc_bible_modal_btn_7"
              defaultIcon={<Plus className="w-4 h-4" />}
              onClick={activeTab === "characters" ? handleAddCharacter : handleAddLocation}
disabled={!name.trim()}
className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_bible_modal.button.save_to_bible", " Save to Bible")}
                    </>
                  )}
            </CustomizableButton>
          </div>

          {/* List of existing */}
          <div className="space-y-2">
            <CustomizableLabel
              labelId="imgdesc_bible_modal_item_6"
              as="h4"
              className="text-xs font-bold text-zinc-400 uppercase tracking-wider"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_bible_modal.h4.saved_bible_entries", "Saved Bible Entries")}
                    </>
                  )}
            </CustomizableLabel>
            {activeTab === "characters" ? (
              characters.map((c) => (
                <div key={c.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-start justify-between gap-3 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400">{c.name}</span>
                      <CustomizableButton
                        buttonId="imgdesc_bible_modal_btn_5"
                        onClick={() => onInsertToken(`{character:${c.name}}`)}
className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded hover:bg-emerald-500/20"
                      >
                          {() => (
                              <>
                                {uiText("components_imgdesc_bible_modal.button.insert_token", "+ Insert Token")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{c.description}</p>
                    {c.referenceImages && c.referenceImages.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {c.referenceImages.map((img, idx) => (
                          <img key={idx} src={img} alt={uiText("components_imgdesc_bible_modal.img.thumb.alt", "Thumb")} className="w-8 h-8 rounded object-cover border border-zinc-800" />
                        ))}
                      </div>
                    )}
                  </div>
                  <CustomizableButton
                    buttonId="imgdesc_bible_modal_btn_4"
                    defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => setCharacters((prev) => prev.filter((item) => item.id !== c.id))}
className="p-1.5 text-zinc-600 hover:text-red-400 rounded hover:bg-zinc-800"
                  />
                </div>
              ))
            ) : (
              locations.map((l) => (
                <div key={l.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-start justify-between gap-3 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sky-400">{l.name}</span>
                      <CustomizableButton
                        buttonId="imgdesc_bible_modal_btn_3"
                        onClick={() => onInsertToken(`{location:${l.name}}`)}
className="text-[9px] bg-sky-500/10 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded hover:bg-sky-500/20"
                      >
                          {() => (
                              <>
                                {uiText("components_imgdesc_bible_modal.button.insert_token_2", "+ Insert Token")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{l.description}</p>
                  </div>
                  <CustomizableButton
                    buttonId="imgdesc_bible_modal_btn_2"
                    defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => setLocations((prev) => prev.filter((item) => item.id !== l.id))}
className="p-1.5 text-zinc-600 hover:text-red-400 rounded hover:bg-zinc-800"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_bible_modal_btn_1"
            onClick={onClose}
className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_bible_modal.button.done", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
