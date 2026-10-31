import React, { useState } from "react";
import { Clapperboard, PenTool, Wand2, X } from "lucide-react";
import { MODIFIERS, type Modifier } from "./types";
import { uiText } from "../../hooks/useUIConfig";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

interface DirectorArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: "DirCut" | "Artist";
  selectedModifiers: string[];
  setSelectedModifiers: React.Dispatch<React.SetStateAction<string[]>>;
}

export const DirectorArtistModal: React.FC<DirectorArtistModalProps> = ({
  isOpen, onClose, category, selectedModifiers, setSelectedModifiers
}) => {
  const [sortOrder, setSortOrder] = useState<"last" | "first" | "year">("last");

  if (!isOpen) return null;

  const isDirector = category === "DirCut";
  const title = isDirector ? "Directors (DirCut)" : "Artists";
  const icon = isDirector ? <Clapperboard className="w-5 h-5 text-violet-400" /> : <PenTool className="w-5 h-5 text-pink-400" />;
  const activeColor = isDirector ? "text-violet-400 border-violet-500 bg-violet-600" : "text-pink-400 border-pink-500 bg-pink-600";

  const getLastName = (name: string) => {
    if (name.includes("Bong")) return "Bong";
    if (name.includes("Park")) return "Park";
    if (name.includes("De Palma")) return "De Palma";
    if (name.includes("von Trier")) return "von Trier";
    if (name.includes("Giraud")) return "Moebius";
    return name.split(" ").pop() || name;
  };

  const list = MODIFIERS.filter((m) => m.category === category).sort((a, b) => {
    if (sortOrder === "year") return (a.year || 1970) - (b.year || 1970);
    if (sortOrder === "last") return getLastName(a.name).localeCompare(getLastName(b.name));
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {icon}
              <CustomizableLabel
                labelId="imgdesc_modifier_modals_item_9"
                as="h2"
                className="text-base font-bold text-zinc-100"
              >
                  {() => (
                      <>
                        {title}
                      </>
                    )}
              </CustomizableLabel>
            </div>
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[10px]">
              {(["last", "first", "year"] as const).map((s) => (
                <CustomizableButton
                  buttonId="imgdesc_modifier_modals_btn_8"
                  key={s}
onClick={() => setSortOrder(s)}
className={`px-2.5 py-0.5 rounded capitalize ${sortOrder === s ? `${isDirector ? "bg-violet-600" : "bg-pink-600"} text-white font-bold` : "text-zinc-400"}`}
                >
                    {() => (
                        <>
                          {s === "last" ? "Last Name" : s === "first" ? "First Name" : "Year"}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
          </div>
          <CustomizableButton
            buttonId="imgdesc_modifier_modals_btn_7"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {list.map((m) => {
              const isChecked = selectedModifiers.includes(m.id);
              return (
                <CustomizableLabel
                  labelId="imgdesc_modifier_modals_item_6"
                  as="label"
                  key={m.id}
className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                    isChecked ? `${isDirector ? "bg-violet-950/40 border-violet-500 text-violet-200" : "bg-pink-950/40 border-pink-500 text-pink-200"}` : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                    {() => (
                        <>
                          <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedModifiers((prev) => [...prev, m.id]);
                      else setSelectedModifiers((prev) => prev.filter((id) => id !== m.id));
                    }}
                    className={`mt-0.5 ${isDirector ? "accent-violet-500" : "accent-pink-500"}`}
                  />
                        <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{m.name}</div>
                    <div className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">{m.value}</div>
                  </div>
                        </>
                      )}
                </CustomizableLabel>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_modifier_modals_btn_5"
            onClick={onClose}
className={`px-5 py-2 text-white rounded-xl text-xs font-bold ${isDirector ? "bg-violet-600 hover:bg-violet-500" : "bg-pink-600 hover:bg-pink-500"}`}
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_modifier_modals.button.done", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};

export const GenreModal = ({ isOpen, onClose, selectedModifiers, setSelectedModifiers }: any) => {
  if (!isOpen) return null;
  const genres = MODIFIERS.filter((m) => m.category === "Genre");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-400" />
            <CustomizableLabel
              labelId="imgdesc_modifier_modals_item_4"
              as="h2"
              className="text-base font-bold text-zinc-100"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_modifier_modals.h2.genre_and_atmosphere", "Genre & Atmosphere")}
                    </>
                  )}
            </CustomizableLabel>
          </div>
          <CustomizableButton
            buttonId="imgdesc_modifier_modals_btn_3"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2.5">
            {genres.map((g) => {
              const isChecked = selectedModifiers.includes(g.id);
              return (
                <CustomizableLabel
                  labelId="imgdesc_modifier_modals_item_2"
                  as="label"
                  key={g.id}
className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${isChecked ? "bg-amber-950/40 border-amber-500 text-amber-200" : "bg-zinc-950 border-zinc-800 text-zinc-300"}`}
                >
                    {() => (
                        <>
                          <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedModifiers((prev: any) => [...prev, g.id]);
                      else setSelectedModifiers((prev: any) => prev.filter((id: any) => id !== g.id));
                    }}
                    className="accent-amber-500"
                  />
                        <div>
                    <div className="text-xs font-bold">{g.name}</div>
                    <div className="text-[10px] text-zinc-500 line-clamp-1">{g.value}</div>
                  </div>
                        </>
                      )}
                </CustomizableLabel>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_modifier_modals_btn_1"
            onClick={onClose}
className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_modifier_modals.button.done_2", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
