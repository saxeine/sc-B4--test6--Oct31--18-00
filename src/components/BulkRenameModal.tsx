import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Tag,
  Wand2,
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  X,
  Search,
  Type,
  Scissors,
  Layers,
  CheckSquare,
  FileText,
  Sliders,
  HelpCircle,
  GripVertical,
  GripHorizontal,
  Columns2,
  Rows2,
  Code,
  Trash2,
  Maximize2,
  Minimize2,
  Hash,
} from "lucide-react";
import { cn } from "../utils/cn";
import { HoldButton } from "./HoldButton";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export type RenameTarget = "selected" | "all" | "storyboard";
export type CaseFormat = "none" | "lowercase" | "uppercase" | "title" | "kebab" | "snake";

interface BulkRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  slices: Array<{ name: string; url: string }>;
  selectedSliceUrls: Set<string>;
  storyboardSlots?: Array<{ url: string | null; name: string; story: string }>;
  onApplyRename: (
    renamedSlices: Array<{ url: string; oldName: string; newName: string }>,
    syncSlots: boolean,
    deletedUrls?: Set<string>,
    customItemsOrder?: Array<{ url: string; name: string }>
  ) => void;
}

// Defined quick keyword tags
const DEFINED_WORDS = [
  "frame",
  "slice",
  "sequence",
  "panel",
  "strip",
  "comic",
  "manga",
  "card",
  "tile",
];

// Short form replacements mapping dictionary
const SHORT_FORM_MAP: Record<string, string> = {
  character: "char",
  sequence: "seq",
  storyboard: "sb",
  episode: "ep",
  background: "bg",
  foreground: "fg",
  texture: "tex",
  illustration: "illus",
  animation: "anim",
  component: "comp",
};

export const BulkRenameModal: React.FC<BulkRenameModalProps> = ({
  isOpen,
  onClose,
  selectedSliceUrls,
  slices,
  storyboardSlots = [],
  onApplyRename,
}) => {
  const [target, setTarget] = useState<RenameTarget>(
    selectedSliceUrls && selectedSliceUrls.size > 0 ? "selected" : "all"
  );

  useEffect(() => {
    if (isOpen && selectedSliceUrls && selectedSliceUrls.size > 0) {
      setTarget("selected");
    }
  }, [isOpen, selectedSliceUrls]);

  // Basic Prefix / Suffix & Numbering
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [addNumbering, setAddNumbering] = useState(false);
  const [numberStart, setNumberStart] = useState(1);
  const [numberPadding, setNumberPadding] = useState(2);
  const [numberPosition, setNumberPosition] = useState<"end" | "start">("end");

  // Character Removal (Remove Section)
  const [removeMode, setRemoveMode] = useState<"position" | "text">("position");
  const [removeStartPos, setRemoveStartPos] = useState<number>(1);
  const [removeFromDir, setRemoveFromDir] = useState<"begin" | "end">("begin");
  const [removeCount, setRemoveCount] = useState<number>(0);
  const [removeUntilLast, setRemoveUntilLast] = useState<boolean>(false);
  const [removeTarget, setRemoveTarget] = useState<"name" | "ext">("name");

  // By Specified Text options
  const [removeText, setRemoveText] = useState<string>("");
  const [removeTextMatchCase, setRemoveTextMatchCase] = useState<boolean>(false);
  const [removeTextOccurrence, setRemoveTextOccurrence] = useState<"all" | "first" | "last">("all");
  const [stripTrailingUnderscores, setStripTrailingUnderscores] = useState<boolean>(false);

  // Resizable Panel Division & Layout Modes ("split-v" | "split-h" | "full")
  const [previewLayoutMode, setPreviewLayoutMode] = useState<"split-v" | "split-h" | "full">("split-v");
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const [topPanelHeight, setTopPanelHeight] = useState<number>(50);
  const [isDraggingDivider, setIsDraggingDivider] = useState<boolean>(false);
  const [isDraggingDividerH, setIsDraggingDividerH] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Draggable Modal Position State
  const [modalPos, setModalPos] = useState<{ x: number; y: number }>(() => {
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;
    const initialW = Math.min(1180, Math.max(320, winW - 32));
    const initialH = Math.min(840, Math.max(300, winH - 32));
    return {
      x: Math.max(16, Math.floor((winW - initialW) / 2)),
      y: Math.max(16, Math.floor((winH - initialH) / 2)),
    };
  });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initX: number; initY: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
      const winH = typeof window !== "undefined" ? window.innerHeight : 800;
      const initialW = Math.min(1180, Math.max(320, winW - 32));
      const initialH = Math.min(840, Math.max(300, winH - 32));
      setModalPos({
        x: Math.max(16, Math.floor((winW - initialW) / 2)),
        y: Math.max(16, Math.floor((winH - initialH) / 2)),
      });
    }
  }, [isOpen]);

  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, select, label, textarea, a, [data-interactive='true']")) return;

    e.preventDefault();
    setIsDraggingModal(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initX: modalPos.x,
      initY: modalPos.y,
    };
  };

  useEffect(() => {
    if (!isDraggingModal) return;

    const handlePointerMove = (e: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = e.clientX - start.mouseX;
      const dy = e.clientY - start.mouseY;
      const maxW = window.innerWidth || 1200;
      const maxH = window.innerHeight || 800;
      const newX = Math.max(8, Math.min(maxW - 120, start.initX + dx));
      const newY = Math.max(8, Math.min(maxH - 80, start.initY + dy));
      setModalPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDraggingModal(false);
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingModal]);

  // Macro Pattern States
  const [macroPattern, setMacroPattern] = useState<string>("");
  const [macroStartAt, setMacroStartAt] = useState<number>(1);
  const [macroIncrement, setMacroIncrement] = useState<number>(1);
  const [macroDigits, setMacroDigits] = useState<number>(1);
  const [macroByFolder, setMacroByFolder] = useState<boolean>(false);
  const macroInputRef = useRef<HTMLInputElement>(null);

  // Collapsible Tool Panels (Remove is default open)
  const [panelKeywordsOpen, setPanelKeywordsOpen] = useState<boolean>(false);
  const [panelMacroOpen, setPanelMacroOpen] = useState<boolean>(false);
  const [panelRemoveOpen, setPanelRemoveOpen] = useState<boolean>(true);
  const [panelPrefixOpen, setPanelPrefixOpen] = useState<boolean>(false);
  const [panelFormattingOpen, setPanelFormattingOpen] = useState<boolean>(false);
  const [panelSearchReplaceOpen, setPanelSearchReplaceOpen] = useState<boolean>(false);
  const [panelPresetsOpen, setPanelPresetsOpen] = useState<boolean>(false);

  const toggleExpandAllPanels = (expand: boolean) => {
    setPanelKeywordsOpen(expand);
    setPanelMacroOpen(expand);
    setPanelRemoveOpen(expand);
    setPanelPrefixOpen(expand);
    setPanelFormattingOpen(expand);
    setPanelSearchReplaceOpen(expand);
    setPanelPresetsOpen(expand);
  };

  const insertMacroTag = (tag: string) => {
    if (macroInputRef.current) {
      const start = macroInputRef.current.selectionStart ?? macroPattern.length;
      const end = macroInputRef.current.selectionEnd ?? macroPattern.length;
      const newText = macroPattern.slice(0, start) + tag + macroPattern.slice(end);
      setMacroPattern(newText);
      setTimeout(() => {
        if (macroInputRef.current) {
          macroInputRef.current.focus();
          macroInputRef.current.setSelectionRange(start + tag.length, start + tag.length);
        }
      }, 0);
    } else {
      setMacroPattern((prev) => prev + tag);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isDraggingDivider && !isDraggingDividerH) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      if (isDraggingDivider) {
        const offset = e.clientX - rect.left;
        const percentage = (offset / rect.width) * 100;
        const clamped = Math.max(20, Math.min(80, percentage));
        setLeftPanelWidth(clamped);
      } else if (isDraggingDividerH) {
        const offset = e.clientY - rect.top;
        const percentage = (offset / rect.height) * 100;
        const clamped = Math.max(20, Math.min(80, percentage));
        setTopPanelHeight(clamped);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      if (isDraggingDivider) {
        const offset = e.touches[0].clientX - rect.left;
        const percentage = (offset / rect.width) * 100;
        const clamped = Math.max(20, Math.min(80, percentage));
        setLeftPanelWidth(clamped);
      } else if (isDraggingDividerH) {
        const offset = e.touches[0].clientY - rect.top;
        const percentage = (offset / rect.height) * 100;
        const clamped = Math.max(20, Math.min(80, percentage));
        setTopPanelHeight(clamped);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingDivider(false);
      setIsDraggingDividerH(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDraggingDivider, isDraggingDividerH]);

  // Short form conversion
  const [applyShortForm, setApplyShortForm] = useState(false);

  // Case Transformation
  const [caseFormat, setCaseFormat] = useState<CaseFormat>("none");

  // Search & Replace
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [regexGlobal, setRegexGlobal] = useState(true);
  const [regexCaseInsensitive, setRegexCaseInsensitive] = useState(true);

  // Filter preview search term
  const [previewFilter, setPreviewFilter] = useState("");
  const [syncBoardSlots, setSyncBoardSlots] = useState(true);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);

  // Dynamic state for studio reordering & deletion
  const [customItems, setCustomItems] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [deletedUrls, setDeletedUrls] = useState<Set<string>>(new Set());
  const [draggedStudioIdx, setDraggedStudioIdx] = useState<number | null>(null);

  // Sync customItems with latest storyboard / slices whenever target or open state changes
  useEffect(() => {
    if (!isOpen) return;

    // Create a map of updated slot names from Storyboard
    const slotNameMap = new Map<string, string>();
    (storyboardSlots || []).forEach((slot) => {
      if (slot.url && slot.name && slot.name.trim() !== "") {
        slotNameMap.set(slot.url, slot.name);
      }
    });

    let initialItems: Array<{ id: string; name: string; url: string }> = [];
    if (target === "selected" && selectedSliceUrls.size > 0) {
      const addedUrls = new Set<string>();
      initialItems = [];

      // First check storyboardSlots in visual order
      (storyboardSlots || []).forEach((slot, idx) => {
        if (slot.url && selectedSliceUrls.has(slot.url) && !addedUrls.has(slot.url)) {
          addedUrls.add(slot.url);
          initialItems.push({
            id: `selected-slot-${idx}-${slot.url.slice(0, 16)}`,
            name: slot.name || slotNameMap.get(slot.url) || `Slot ${idx + 1}`,
            url: slot.url,
          });
        }
      });

      // Then check slices from pool
      slices.forEach((s, idx) => {
        if (selectedSliceUrls.has(s.url) && !addedUrls.has(s.url)) {
          addedUrls.add(s.url);
          initialItems.push({
            id: `selected-slice-${idx}-${s.url.slice(0, 16)}`,
            name: slotNameMap.get(s.url) || s.name,
            url: s.url,
          });
        }
      });
    } else if (target === "storyboard") {
      initialItems = (storyboardSlots || [])
        .filter((slot) => slot.url !== null)
        .map((slot, i) => ({
          id: `storyboard-slot-${i}-${slot.url?.slice(0, 16)}`,
          name: slot.name || slotNameMap.get(slot.url!) || `Slot ${i + 1}`,
          url: slot.url!,
        }));
    } else {
      // Default / All target: if storyboard has filled slots, use storyboard sequence and custom names
      const storyboardFilled = (storyboardSlots || []).filter((slot) => slot.url !== null);
      if (storyboardFilled.length > 0) {
        const urlSetInStoryboard = new Set<string>();
        initialItems = storyboardFilled.map((slot, i) => {
          urlSetInStoryboard.add(slot.url!);
          return {
            id: `all-board-${i}-${slot.url?.slice(0, 16)}`,
            name: slot.name || `Slot ${i + 1}`,
            url: slot.url!,
          };
        });
        // Append remaining pool slices not placed on storyboard
        slices.forEach((s, idx) => {
          if (!urlSetInStoryboard.has(s.url)) {
            initialItems.push({
              id: `all-pool-${idx}-${s.url.slice(0, 16)}`,
              name: slotNameMap.get(s.url) || s.name,
              url: s.url,
            });
          }
        });
      } else {
        initialItems = slices.map((s, idx) => ({
          id: `all-slice-${idx}-${s.url.slice(0, 16)}`,
          name: slotNameMap.get(s.url) || s.name,
          url: s.url,
        }));
      }
    }

    setCustomItems(initialItems);
    setDeletedUrls(new Set());
  }, [isOpen, target, slices, selectedSliceUrls, storyboardSlots]);

  // Handle reordering in studio list
  const handleReorderStudioItems = (fromIdx: number, toIdx: number) => {
    setCustomItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  // Handle frame deletion in studio list
  const handleDeleteStudioItem = (urlToDelete: string) => {
    setCustomItems((prev) => prev.filter((item) => item.url !== urlToDelete));
    setDeletedUrls((prev) => {
      const next = new Set(prev);
      next.add(urlToDelete);
      return next;
    });
  };

  // Target items currently active after deletions & reordering
  const activeItems = useMemo(() => {
    return customItems.filter((item) => !deletedUrls.has(item.url));
  }, [customItems, deletedUrls]);

  // Regex validity check
  const regexError = useMemo(() => {
    if (!useRegex || !findText) return null;
    try {
      const flags = `${regexGlobal ? "g" : ""}${regexCaseInsensitive ? "i" : ""}`;
      new RegExp(findText, flags);
      return null;
    } catch (err: any) {
      return err?.message || "Invalid regular expression";
    }
  }, [useRegex, findText, regexGlobal, regexCaseInsensitive]);

  // Helper to render original name with highlighted start position and trimmed characters
  const renderHighlightedName = (fullName: string) => {
    if (!fullName) return fullName;
    const extMatch = fullName.match(/(\.[a-zA-Z0-9]{2,5})$/i);
    let baseName = fullName;
    let ext = "";
    if (extMatch) {
      ext = extMatch[1];
      baseName = fullName.slice(0, extMatch.index);
    }

    if (!baseName) return fullName;

    const targetStr = removeTarget === "name" ? baseName : ext.replace(/^\./, "");
    const chars = baseName.split("");

    let startIdx = -1;
    let isTrimmedMap = new Set<number>();

    if (removeTarget === "name" && targetStr) {
      const L = targetStr.length;
      if (removeMode === "position") {
        if (removeFromDir === "begin") {
          startIdx = Math.max(0, Math.min(L - 1, removeStartPos - 1));
          if (removeUntilLast) {
            for (let i = startIdx; i < L; i++) isTrimmedMap.add(i);
          } else if (removeCount > 0) {
            for (let i = startIdx; i < Math.min(L, startIdx + removeCount); i++) isTrimmedMap.add(i);
          }
        } else {
          const startIdxFromEnd = Math.max(1, Math.min(L, removeStartPos));
          startIdx = L - startIdxFromEnd;
          if (removeUntilLast) {
            for (let i = startIdx; i < L; i++) isTrimmedMap.add(i);
          } else if (removeCount > 0) {
            for (let i = startIdx; i < Math.min(L, startIdx + removeCount); i++) isTrimmedMap.add(i);
          }
        }
      } else if (removeMode === "text" && removeText) {
        const escaped = removeText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const flags = removeTextMatchCase ? "g" : "gi";
        const matches = Array.from(targetStr.matchAll(new RegExp(escaped, flags)));
        if (matches.length > 0) {
          if (removeTextOccurrence === "all") {
            matches.forEach((m) => {
              if (m.index !== undefined) {
                for (let i = m.index; i < m.index + removeText.length; i++) isTrimmedMap.add(i);
              }
            });
          } else if (removeTextOccurrence === "first") {
            const m = matches[0];
            if (m.index !== undefined) {
              for (let i = m.index; i < m.index + removeText.length; i++) isTrimmedMap.add(i);
            }
          } else if (removeTextOccurrence === "last") {
            const m = matches[matches.length - 1];
            if (m.index !== undefined) {
              for (let i = m.index; i < m.index + removeText.length; i++) isTrimmedMap.add(i);
            }
          }
        }
      }

      if (stripTrailingUnderscores) {
        const trailingMatch = targetStr.match(/_+$/);
        if (trailingMatch && trailingMatch.index !== undefined) {
          for (let i = trailingMatch.index; i < targetStr.length; i++) isTrimmedMap.add(i);
        }
      }
    }

    return (
      <span className="inline-flex items-center flex-wrap gap-0.5 font-mono text-xs max-w-full overflow-hidden truncate">
        {chars.map((char, charIdx) => {
          const isStartPos = charIdx === startIdx && removeMode === "position" && removeTarget === "name";
          const isTrimmed = isTrimmedMap.has(charIdx);

          if (isStartPos) {
            return (
              <span
                key={charIdx}
                className={cn(
                  "font-black text-amber-300 bg-amber-950/90 ring-1 ring-amber-400 px-1 py-0.5 rounded text-[13px] leading-none shadow-sm",
                  isTrimmed && "line-through text-rose-300 bg-rose-950/90 ring-rose-500"
                )}
                title={`Start Pos ${removeStartPos} (Letter '${char}')`}
              >
                {char === " " ? "␣" : char}
              </span>
            );
          }

          if (isTrimmed) {
            return (
              <span
                key={charIdx}
                className="text-rose-400 line-through bg-rose-950/60 font-semibold px-0.5 rounded text-xs"
                title={`Removed char '${char}'`}
              >
                {char === " " ? "␣" : char}
              </span>
            );
          }

          return (
            <span key={charIdx} className="text-slate-300">
              {char}
            </span>
          );
        })}
        {ext && <span className={cn("text-slate-500", removeTarget === "ext" && "text-amber-400 font-bold")}>{ext}</span>}
      </span>
    );
  };

  // Transform single string function (preserves extensions like .png, .jpg)
  const transformName = (originalName: string, index: number): string => {
    let name = originalName;

    // Extract file extension if present
    const extMatch = name.match(/(\.[a-zA-Z0-9]{2,5})$/i);
    let baseName = name;
    let ext = "";
    if (extMatch) {
      ext = extMatch[1];
      baseName = name.slice(0, extMatch.index);
    }

    // Helper function to process character removal on a target string
    const processRemoval = (str: string): string => {
      if (!str) return str;
      let targetStr = str;

      if (removeMode === "position") {
        const L = targetStr.length;
        if (L === 0) return targetStr;

        if (removeFromDir === "begin") {
          const startIdx = Math.max(0, Math.min(L, removeStartPos - 1));
          if (removeUntilLast) {
            targetStr = targetStr.slice(0, startIdx);
          } else if (removeCount > 0) {
            targetStr = targetStr.slice(0, startIdx) + targetStr.slice(startIdx + removeCount);
          }
        } else {
          // removeFromDir === "end"
          const startIdxFromEnd = Math.max(1, Math.min(L, removeStartPos));
          const idx = L - startIdxFromEnd;
          if (removeUntilLast) {
            targetStr = targetStr.slice(0, idx);
          } else if (removeCount > 0) {
            targetStr = targetStr.slice(0, idx) + targetStr.slice(idx + removeCount);
          }
        }
      } else if (removeMode === "text" && removeText) {
        const escaped = removeText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        if (removeTextOccurrence === "all") {
          const flags = removeTextMatchCase ? "g" : "gi";
          targetStr = targetStr.replace(new RegExp(escaped, flags), "");
        } else if (removeTextOccurrence === "first") {
          const flags = removeTextMatchCase ? "" : "i";
          targetStr = targetStr.replace(new RegExp(escaped, flags), "");
        } else if (removeTextOccurrence === "last") {
          const flags = removeTextMatchCase ? "g" : "gi";
          const matches = Array.from(targetStr.matchAll(new RegExp(escaped, flags)));
          if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            if (lastMatch.index !== undefined) {
              targetStr =
                targetStr.slice(0, lastMatch.index) +
                targetStr.slice(lastMatch.index + removeText.length);
            }
          }
        }
      }

      return targetStr;
    };

    if (removeTarget === "name") {
      baseName = processRemoval(baseName);
      if (stripTrailingUnderscores) {
        baseName = baseName.replace(/_+$/, "");
      }
    } else if (removeTarget === "ext" && ext) {
      const cleanExt = ext.replace(/^\./, "");
      let processedExt = processRemoval(cleanExt);
      if (stripTrailingUnderscores) {
        processedExt = processedExt.replace(/_+$/, "");
      }
      ext = processedExt ? `.${processedExt}` : "";
    }

    // 3. Short form conversion
    if (applyShortForm) {
      Object.entries(SHORT_FORM_MAP).forEach(([full, short]) => {
        const re = new RegExp(full, "gi");
        baseName = baseName.replace(re, short);
      });
    }

    // 4. Find & Replace
    if (findText) {
      if (useRegex && !regexError) {
        try {
          const flags = `${regexGlobal ? "g" : ""}${regexCaseInsensitive ? "i" : ""}`;
          const re = new RegExp(findText, flags);
          baseName = baseName.replace(re, replaceText);
        } catch (e) {
          // fallback ignore error
        }
      } else if (!useRegex) {
        if (regexCaseInsensitive) {
          const re = new RegExp(findText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "gi");
          baseName = baseName.replace(re, replaceText);
        } else {
          baseName = baseName.split(findText).join(replaceText);
        }
      }
    }

    // 5. Case Formatting
    if (caseFormat === "lowercase") {
      baseName = baseName.toLowerCase();
    } else if (caseFormat === "uppercase") {
      baseName = baseName.toUpperCase();
    } else if (caseFormat === "title") {
      baseName = baseName
        .toLowerCase()
        .replace(/(?:^|\s|-|_)\S/g, (a) => a.toUpperCase());
    } else if (caseFormat === "kebab") {
      baseName = baseName.replace(/[\s_]+/g, "-").toLowerCase();
    } else if (caseFormat === "snake") {
      baseName = baseName.replace(/[\s-]+/g, "_").toLowerCase();
    }

    // 6. Macro Pattern OR Prefix & Suffix & Indexing
    if (macroPattern && macroPattern.trim() !== "") {
      const counterVal = macroStartAt + index * macroIncrement;
      const counterStr = String(counterVal).padStart(macroDigits, "0");
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const folderStr = "Slices";

      let evaluated = macroPattern;
      const hasExtTag = /<e>/i.test(evaluated);

      // Replace .<e> or <e>
      evaluated = evaluated.replace(/\.<e>/gi, ext ? (ext.startsWith(".") ? ext : `.${ext}`) : "");
      evaluated = evaluated.replace(/<e>/gi, ext);
      evaluated = evaluated.replace(/<n>/gi, baseName);
      evaluated = evaluated.replace(/<c>/gi, counterStr);
      evaluated = evaluated.replace(/<d>/gi, dateStr);
      evaluated = evaluated.replace(/<f>/gi, folderStr);

      if (hasExtTag) {
        baseName = evaluated;
        ext = ""; // Extension was evaluated via tag
      } else {
        baseName = evaluated;
      }
    } else {
      // Standard Prefix & Suffix & Indexing
      const numStr = addNumbering
        ? `_${String(numberStart + index).padStart(numberPadding, "0")}`
        : "";

      if (numberPosition === "start") {
        baseName = `${numStr}${prefix}${baseName}${suffix}`;
      } else {
        // "end" position before extension
        baseName = `${prefix}${baseName}${suffix}${numStr}`;
      }
    }

    const finalName = `${baseName.trim()}${ext}`;
    return finalName || originalName;
  };

  // Generate complete preview results based on activeItems (ordered & non-deleted)
  const previewResults = useMemo(() => {
    return activeItems.map((item, index) => {
      const newName = transformName(item.name, index);
      return {
        id: item.id,
        url: item.url,
        oldName: item.name,
        newName,
        isModified: item.name !== newName,
      };
    });
  }, [
    activeItems,
    prefix,
    suffix,
    addNumbering,
    numberStart,
    numberPadding,
    numberPosition,
    removeMode,
    removeStartPos,
    removeFromDir,
    removeCount,
    removeUntilLast,
    removeTarget,
    removeText,
    removeTextMatchCase,
    removeTextOccurrence,
    stripTrailingUnderscores,
    macroPattern,
    macroStartAt,
    macroIncrement,
    macroDigits,
    macroByFolder,
    applyShortForm,
    caseFormat,
    findText,
    replaceText,
    useRegex,
    regexGlobal,
    regexCaseInsensitive,
    regexError,
  ]);

  // Filtered preview results
  const filteredPreview = useMemo(() => {
    if (!previewFilter.trim()) return previewResults;
    const term = previewFilter.toLowerCase();
    return previewResults.filter(
      (p) =>
        p.oldName.toLowerCase().includes(term) ||
        p.newName.toLowerCase().includes(term)
    );
  }, [previewResults, previewFilter]);

  // Check for duplicate names
  const duplicateCount = useMemo(() => {
    const set = new Set<string>();
    let dupes = 0;
    for (const item of previewResults) {
      if (set.has(item.newName)) {
        dupes++;
      } else {
        set.add(item.newName);
      }
    }
    return dupes;
  }, [previewResults]);

  // Preset Macro Handlers
  const applyPresetMacro = (type: string) => {
    switch (type) {
      case "frame":
        setPrefix("frame");
        setSuffix("");
        setAddNumbering(true);
        setNumberStart(1);
        setNumberPadding(2);
        setRemoveCount(0);
        setRemoveUntilLast(false);
        break;
      case "panel":
        setPrefix("panel");
        setSuffix("");
        setAddNumbering(true);
        setNumberStart(1);
        setNumberPadding(2);
        break;
      case "strip":
        setPrefix("strip");
        setSuffix("");
        setAddNumbering(true);
        setNumberStart(1);
        setNumberPadding(2);
        break;
      case "short":
        setApplyShortForm(true);
        setCaseFormat("lowercase");
        break;
      case "clean":
        setRemoveStartPos(1);
        setRemoveFromDir("begin");
        setRemoveCount(0);
        setRemoveUntilLast(false);
        setRemoveText("");
        setPrefix("");
        setSuffix("");
        setFindText("");
        setReplaceText("");
        setCaseFormat("lowercase");
        break;
      default:
        break;
    }
  };

  const handleResetAll = () => {
    setPrefix("");
    setSuffix("");
    setAddNumbering(false);
    setNumberStart(1);
    setNumberPadding(2);
    setRemoveMode("position");
    setRemoveStartPos(1);
    setRemoveFromDir("begin");
    setRemoveCount(0);
    setRemoveUntilLast(false);
    setRemoveTarget("name");
    setRemoveText("");
    setRemoveTextMatchCase(false);
    setRemoveTextOccurrence("all");
    setStripTrailingUnderscores(false);
    setApplyShortForm(false);
    setCaseFormat("none");
    setFindText("");
    setReplaceText("");
    setUseRegex(false);
    setPreviewFilter("");
    setMacroPattern("");
    setMacroStartAt(1);
    setMacroIncrement(1);
    setMacroDigits(1);
    setMacroByFolder(false);
    setPreviewLayoutMode("split-v");
    setLeftPanelWidth(55);
    setTopPanelHeight(50);
    toggleExpandAllPanels(false);
  };

  const handleQuickRenameSequential = () => {
    const itemsToRename = customItems.length > 0
      ? customItems.filter((item) => !deletedUrls.has(item.url))
      : slices;
    if (itemsToRename.length === 0) return;

    const renamedList = itemsToRename.map((item, index) => {
      const seqNumber = String(index + 1).padStart(4, "0");
      const newName = `Slice-${seqNumber}`;
      return {
        url: item.url,
        oldName: item.name,
        newName,
      };
    });

    const customOrder = itemsToRename.map((item, index) => ({
      url: item.url,
      name: `Slice-${String(index + 1).padStart(4, "0")}`,
    }));

    onApplyRename(renamedList, true, deletedUrls, customOrder);
    setAppliedNotice(`Renamed all ${renamedList.length} slices to Slice-0001, Slice-0002...`);

    setTimeout(() => {
      setAppliedNotice(null);
      onClose();
    }, 400);
  };

  const handleApply = () => {
    if (previewResults.length === 0 && deletedUrls.size === 0) return;
    if (useRegex && regexError) return;

    onApplyRename(previewResults, syncBoardSlots, deletedUrls, activeItems);
    setAppliedNotice(`Successfully applied rename, reordering & frame changes!`);

    // Reset Character Removal parameters to start at 1, count zero
    setRemoveStartPos(1);
    setRemoveCount(0);
    setNumberStart(1);
    setRemoveUntilLast(false);
    setRemoveText("");
    setStripTrailingUnderscores(false);

    setTimeout(() => {
      setAppliedNotice(null);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
      <div
        style={{
          position: "fixed",
          left: `${modalPos.x}px`,
          top: `${modalPos.y}px`,
          width: "min(1180px, calc(100vw - 32px))",
          height: "min(840px, calc(100vh - 32px))",
        }}
        className={cn(
          "bg-[#0b1329] border border-[#1e293b] rounded-2xl flex flex-col shadow-2xl overflow-hidden pointer-events-auto transition-shadow",
          isDraggingModal && "ring-2 ring-[#10b981]/50 cursor-grabbing shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        )}
      >
        {/* Header (Draggable) */}
        <div
          onPointerDown={handleHeaderPointerDown}
          className="px-5 py-3.5 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          title={uiText("components_bulk_rename_modal.div.click_and_drag_header_bar_to_move_modal_wind.title", "Click and drag header bar to move modal window around screen")}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#10b981]/10 rounded-xl border border-[#10b981]/20">
              <Tag className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <CustomizableLabel
                  labelId="bulk_rename_modal_item_59"
                  as="h2"
                  className="text-sm font-extrabold text-slate-100"
                >
                    {() => (
                        <>
                          {uiText("components_bulk_rename_modal.h2.bulk_rename_studio", "Bulk Rename Studio")}
                        </>
                      )}
                </CustomizableLabel>
                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_58"
                  defaultIcon={<Sparkles className="w-3 h-3 text-[#10b981]" />}
                  type="button"
onClick={handleQuickRenameSequential}
className="px-2.5 py-0.5 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 hover:border-[#10b981] text-[#10b981] hover:text-emerald-300 rounded-full text-[10.5px] font-bold font-mono transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
title={uiText("components_bulk_rename_modal.button.quick_rename_sequentially_rename_all_slices.title", "Quick Rename: Sequentially rename all slices to Slice-0001, Slice-0002..., save, and return to Storyboard")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_bulk_rename_modal.span.quick_rename_slice_xxxx", "Quick Rename: Slice-xxxx")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
              <p className="text-[11px] text-slate-400">
                {uiText("components_bulk_rename_modal.p.transform_index_and_organize_your_sliced_ass", "Transform, index, and organize your sliced asset names instantly")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="bulk_rename_modal_btn_57"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
title={uiText("components_bulk_rename_modal.button.close_modal.title", "Close modal")}
          />
        </div>

        {/* Content Body - Multi-Layout View (Side-by-Side, Horizontal Split, Full Screen) */}
        <div
          ref={containerRef}
          className={cn(
            "flex-1 min-h-0 overflow-hidden relative divide-[#1e293b]",
            previewLayoutMode === "split-h" || !isDesktop
              ? "flex flex-col divide-y"
              : "flex flex-col md:flex-row divide-y md:divide-y-0",
            (isDraggingDivider || isDraggingDividerH) && "select-none"
          )}
        >
          {/* Controls Column (Hidden in Full Screen layout) */}
          {previewLayoutMode !== "full" && (
            <div
              style={
                previewLayoutMode === "split-h"
                  ? { height: `${topPanelHeight}%` }
                  : previewLayoutMode === "split-v" && isDesktop
                  ? { width: `${leftPanelWidth}%` }
                  : { height: `${topPanelHeight}%` }
              }
              className={cn(
                "p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 transition-all shrink-0 min-h-0 min-w-0",
                previewLayoutMode === "split-h" || !isDesktop
                  ? "w-full"
                  : "h-full w-full md:w-auto"
              )}
            >
            {/* Target Scope Selection */}
            <div className="space-y-1.5">
              <CustomizableLabel
                labelId="bulk_rename_modal_item_56"
                defaultIcon={<Layers className="w-3.5 h-3.5 text-[#10b981]" />}
                as="label"
                className="text-[11px] font-bold text-slate-300 block flex items-center gap-1.5"
              >
                  {() => (
                      <>
                        {uiText("components_bulk_rename_modal.label.target_selection_scope", "Target Selection Scope:")}
                      </>
                    )}
              </CustomizableLabel>
              <div className="grid grid-cols-3 gap-1.5 bg-[#020617] p-1 rounded-xl border border-[#1e293b] text-xs">
                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_55"
                  defaultIcon={<CheckSquare className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setTarget("selected")}
disabled={selectedSliceUrls.size === 0}
className={cn(
                    "py-1.5 px-2 font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px]",
                    target === "selected" && selectedSliceUrls.size > 0
                      ? "bg-[#0f172a] text-[#10b981] shadow-sm border border-[#10b981]/30"
                      : "text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                    {() => (
                        <>
                          <span>{uiText("components_bulk_rename_modal.span.selected", "Selected (")}{selectedSliceUrls.size})</span>
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_54"
                  defaultIcon={<FileText className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setTarget("all")}
className={cn(
                    "py-1.5 px-2 font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px]",
                    target === "all"
                      ? "bg-[#0f172a] text-[#10b981] shadow-sm border border-[#10b981]/30"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          <span>{uiText("components_bulk_rename_modal.span.all_slices", "All Slices (")}{slices.length})</span>
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_53"
                  defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setTarget("storyboard")}
disabled={storyboardSlots.length === 0}
className={cn(
                    "py-1.5 px-2 font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px]",
                    target === "storyboard"
                      ? "bg-[#0f172a] text-[#10b981] shadow-sm border border-[#10b981]/30"
                      : "text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                    {() => (
                        <>
                          <span>{uiText("components_bulk_rename_modal.span.storyboard", "Storyboard (")}{storyboardSlots.filter((s) => s.url).length})</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {/* Global Expand/Collapse All Toolbar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 py-1.5 px-2 bg-[#020617] rounded-xl border border-[#1e293b]">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#10b981]" />
                {uiText("components_bulk_rename_modal.span.transformation_tool_panels", "Transformation Tool Panels:")}
              </span>
              <div className="flex items-center gap-2 font-mono text-[10.5px]">
                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_52"
                  type="button"
onClick={() => toggleExpandAllPanels(true)}
className="text-slate-400 hover:text-[#10b981] font-bold transition-colors cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_bulk_rename_modal.button.expand_all", "Expand All")}
                        </>
                      )}
                </CustomizableButton>
                <span className="text-slate-600">|</span>
                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_51"
                  type="button"
onClick={() => toggleExpandAllPanels(false)}
className="text-slate-400 hover:text-[#10b981] font-bold transition-colors cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_bulk_rename_modal.button.collapse_all", "Collapse All")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {/* 1. Character Removal Panel */}
            <div className="bg-[#020617]/70 rounded-xl border border-[#1e293b] overflow-hidden transition-all">
              <CustomizableButton
                buttonId="bulk_rename_modal_btn_50"
                type="button"
onClick={() => setPanelRemoveOpen(!panelRemoveOpen)}
className="w-full flex items-center justify-between p-3 hover:bg-[#0f172a] transition-colors cursor-pointer text-left select-none"
              >
                  {() => (
                      <>
                        <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[11px] font-bold text-slate-200">
                    {uiText("components_bulk_rename_modal.span.remove_character_removal", "Remove (Character Removal)")}
                  </span>
                  {((removeMode === "position" && removeCount > 0) ||
                    (removeMode === "text" && removeText !== "") ||
                    stripTrailingUnderscores) && (
                    <span className="text-[9.5px] text-[#10b981] font-mono bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/30 font-bold">
                      {uiText("components_bulk_rename_modal.span.removal_active", "Removal Active")}
                    </span>
                  )}
                </div>
                      <div className="flex items-center gap-2 text-slate-400">
                  {/* Secondary Index Counter Toggle */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddNumbering(!addNumbering);
                    }}
                    className={cn(
                      "px-2 py-0.5 text-[10.5px] rounded-md border transition-all flex items-center gap-1.5 cursor-pointer select-none font-semibold",
                      addNumbering
                        ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50 shadow-sm"
                        : "bg-[#020617] text-slate-400 border-[#1e293b] hover:text-slate-200 hover:border-slate-700"
                    )}
                    title={uiText("components_bulk_rename_modal.div.toggle_sequential_index_counter_auto_numberi.title", "Toggle sequential Index Counter auto-numbering (_01, _02...)")}
                  >
                    <input
                      type="checkbox"
                      checked={addNumbering}
                      onChange={(e) => {
                        e.stopPropagation();
                        setAddNumbering(e.target.checked);
                      }}
                      className="w-3 h-3 rounded bg-[#0b1329] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer pointer-events-none"
                    />
                    <span>{uiText("components_bulk_rename_modal.span.index_counter", "Index Counter")}</span>
                    <span
                      className={cn(
                        "text-[9px] font-mono font-bold px-1 rounded",
                        addNumbering ? "bg-[#10b981]/30 text-emerald-300" : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {addNumbering ? "ON" : "OFF"}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    {panelRemoveOpen ? "Collapse" : "Expand"}
                  </span>
                  {panelRemoveOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#10b981]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                      </>
                    )}
              </CustomizableButton>

              {panelRemoveOpen && (
                <div className="p-3 border-t border-[#1e293b] space-y-3 bg-[#020617]/50">
                  {/* Header with Mode Selection Radio Buttons */}
                  <div className="flex items-center justify-between border-b border-[#1e293b]/80 pb-2">
                    <span className="text-[11px] font-bold text-slate-300">
                      {uiText("components_bulk_rename_modal.span.removal_strategy", "Removal Strategy:")}
                    </span>

                    {/* Radio options: (•) by position    ( ) by specified text */}
                    <div className="flex items-center gap-3 text-xs">
                      <CustomizableLabel
                        labelId="bulk_rename_modal_item_49"
                        as="label"
                        className="flex items-center gap-1.5 text-slate-200 cursor-pointer font-medium select-none"
                      >
                          {() => (
                              <>
                                <input
                          type="radio"
                          name="removeMode"
                          checked={removeMode === "position"}
                          onChange={() => setRemoveMode("position")}
                          className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b] cursor-pointer"
                        />
                              <span>{uiText("components_bulk_rename_modal.span.by_position", "by position")}</span>
                              </>
                            )}
                      </CustomizableLabel>

                      <CustomizableLabel
                        labelId="bulk_rename_modal_item_48"
                        as="label"
                        className="flex items-center gap-1.5 text-slate-200 cursor-pointer font-medium select-none"
                      >
                          {() => (
                              <>
                                <input
                          type="radio"
                          name="removeMode"
                          checked={removeMode === "text"}
                          onChange={() => setRemoveMode("text")}
                          className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b] cursor-pointer"
                        />
                              <span>{uiText("components_bulk_rename_modal.span.by_specified_text", "by specified text")}</span>
                              </>
                            )}
                      </CustomizableLabel>
                    </div>
                  </div>

                  {/* Main Controls Box with Target Box on Right */}
                  <div className="bg-[#020617] p-3 rounded-xl border border-[#1e293b] flex flex-col sm:flex-row items-stretch gap-3">
                    {/* Left Controls depending on removeMode */}
                    <div className="flex-1 space-y-2.5">
                      {removeMode === "position" ? (
                        <div className="space-y-2.5">
                          {/* Row 1: Start at [ 1 ▲▼ ] th   (•) From begin   ( ) From end */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-300 font-medium">{uiText("components_bulk_rename_modal.span.start_at", "Start at")}</span>
                              <div className="relative flex items-center w-16">
                                <input
                                  type="number"
                                  min={1}
                                  max={999}
                                  value={removeStartPos}
                                  onChange={(e) => setRemoveStartPos(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-md pl-2 pr-5 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="absolute right-0.5 flex flex-col">
                                  <HoldButton
                                    onAction={() => setRemoveStartPos((v) => v + 1)}
                                    className="p-0.5 text-slate-400 hover:text-[#10b981] cursor-pointer"
                                    title={uiText("components_bulk_rename_modal.hold_button.increase_start_position.title", "Increase start position")}
                                  >
                                    <ChevronUp className="w-2.5 h-2.5" />
                                  </HoldButton>
                                  <HoldButton
                                    onAction={() => setRemoveStartPos((v) => Math.max(1, v - 1))}
                                    className="p-0.5 text-slate-400 hover:text-[#10b981] cursor-pointer"
                                    title={uiText("components_bulk_rename_modal.hold_button.decrease_start_position.title", "Decrease start position")}
                                  >
                                    <ChevronDown className="w-2.5 h-2.5" />
                                  </HoldButton>
                                </div>
                              </div>
                              <span className="text-slate-400 font-mono text-[11px]">{uiText("components_bulk_rename_modal.span.th", "th")}</span>
                            </div>

                            {/* From begin / From end */}
                            <div className="flex items-center gap-2.5 bg-[#090d16] px-2.5 py-1 rounded-md border border-[#1e293b]">
                              <CustomizableLabel
                                labelId="bulk_rename_modal_item_47"
                                as="label"
                                className="flex items-center gap-1.5 text-slate-300 cursor-pointer text-xs select-none"
                              >
                                  {() => (
                                      <>
                                        <input
                                  type="radio"
                                  name="removeFromDir"
                                  checked={removeFromDir === "begin"}
                                  onChange={() => setRemoveFromDir("begin")}
                                  className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b] cursor-pointer"
                                />
                                      <span>{uiText("components_bulk_rename_modal.span.from_begin", "From begin")}</span>
                                      </>
                                    )}
                              </CustomizableLabel>
                              <CustomizableLabel
                                labelId="bulk_rename_modal_item_46"
                                as="label"
                                className="flex items-center gap-1.5 text-slate-300 cursor-pointer text-xs select-none"
                              >
                                  {() => (
                                      <>
                                        <input
                                  type="radio"
                                  name="removeFromDir"
                                  checked={removeFromDir === "end"}
                                  onChange={() => setRemoveFromDir("end")}
                                  className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b] cursor-pointer"
                                />
                                      <span>{uiText("components_bulk_rename_modal.span.from_end", "From end")}</span>
                                      </>
                                    )}
                              </CustomizableLabel>
                            </div>
                          </div>

                          {/* Row 2: Count [ 0 ▲▼ ]   [ ] Until Last */}
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-300 font-medium">{uiText("components_bulk_rename_modal.span.count", "Count")}</span>
                              <div className="relative flex items-center w-16">
                                <input
                                  type="number"
                                  min={0}
                                  max={999}
                                  disabled={removeUntilLast}
                                  value={removeCount}
                                  onChange={(e) => setRemoveCount(Math.max(0, parseInt(e.target.value) || 0))}
                                  className={cn(
                                    "w-full bg-[#090d16] border border-[#1e293b] rounded-md pl-2 pr-5 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                    removeUntilLast && "opacity-40 cursor-not-allowed"
                                  )}
                                />
                                <div className="absolute right-0.5 flex flex-col">
                                  <HoldButton
                                    onAction={() => setRemoveCount((v) => v + 1)}
                                    disabled={removeUntilLast}
                                    className="p-0.5 text-slate-400 hover:text-[#10b981] cursor-pointer disabled:opacity-30"
                                    title={uiText("components_bulk_rename_modal.hold_button.increase_count.title", "Increase count")}
                                  >
                                    <ChevronUp className="w-2.5 h-2.5" />
                                  </HoldButton>
                                  <HoldButton
                                    onAction={() => setRemoveCount((v) => Math.max(0, v - 1))}
                                    disabled={removeUntilLast}
                                    className="p-0.5 text-slate-400 hover:text-[#10b981] cursor-pointer disabled:opacity-30"
                                    title={uiText("components_bulk_rename_modal.hold_button.decrease_count.title", "Decrease count")}
                                  >
                                    <ChevronDown className="w-2.5 h-2.5" />
                                  </HoldButton>
                                </div>
                              </div>
                            </div>

                            <CustomizableLabel
                              labelId="bulk_rename_modal_item_45"
                              as="label"
                              className="flex items-center gap-1.5 text-slate-300 font-medium cursor-pointer select-none"
                            >
                                {() => (
                                    <>
                                      <input
                                type="checkbox"
                                checked={removeUntilLast}
                                onChange={(e) => setRemoveUntilLast(e.target.checked)}
                                className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer"
                              />
                                    <span>{uiText("components_bulk_rename_modal.span.until_last", "Until Last")}</span>
                                    </>
                                  )}
                            </CustomizableLabel>
                          </div>
                        </div>
                      ) : (
                        /* removeMode === "text" */
                        <div className="space-y-2.5">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-300 font-medium block">{uiText("components_bulk_rename_modal.span.text_to_remove", "Text to remove:")}</span>
                              <div className="flex items-center gap-1">
                                <CustomizableButton
                                  buttonId="bulk_rename_modal_btn_44"
                                  defaultLabel={"\"__\""}
                                  type="button"
onClick={() => setRemoveText("__")}
className="px-1.5 py-0.5 bg-[#090d16] hover:bg-[#10b981]/20 hover:text-[#10b981] border border-[#1e293b] rounded text-[10px] font-mono text-slate-300 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.fill_text_with.title", "Fill text with '__'")}
                                />
                                <CustomizableButton
                                  buttonId="bulk_rename_modal_btn_43"
                                  defaultLabel={"\"_\""}
                                  type="button"
onClick={() => setRemoveText("_")}
className="px-1.5 py-0.5 bg-[#090d16] hover:bg-[#10b981]/20 hover:text-[#10b981] border border-[#1e293b] rounded text-[10px] font-mono text-slate-300 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.fill_text_with.title_2", "Fill text with '_'")}
                                />
                                <CustomizableButton
                                  buttonId="bulk_rename_modal_btn_42"
                                  defaultLabel={"\"-\""}
                                  type="button"
onClick={() => setRemoveText("-")}
className="px-1.5 py-0.5 bg-[#090d16] hover:bg-[#10b981]/20 hover:text-[#10b981] border border-[#1e293b] rounded text-[10px] font-mono text-slate-300 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.fill_text_with.title_3", "Fill text with '-'")}
                                />
                              </div>
                            </div>
                            <input
                              type="text"
                              value={removeText}
                              onChange={(e) => setRemoveText(e.target.value)}
                              placeholder={uiText("components_bulk_rename_modal.input.e_g_or_copy.placeholder", "e.g. __ or _copy")}
                              className="w-full bg-[#090d16] border border-[#1e293b] rounded-md px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#10b981] font-mono"
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs">
                            <CustomizableLabel
                              labelId="bulk_rename_modal_item_41"
                              as="label"
                              className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none"
                            >
                                {() => (
                                    <>
                                      <input
                                type="checkbox"
                                checked={removeTextMatchCase}
                                onChange={(e) => setRemoveTextMatchCase(e.target.checked)}
                                className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer"
                              />
                                    <span>{uiText("components_bulk_rename_modal.span.match_case", "Match case")}</span>
                                    </>
                                  )}
                            </CustomizableLabel>

                            <div className="flex items-center gap-2 bg-[#090d16] px-2 py-0.5 rounded-md border border-[#1e293b] text-xs">
                              <span className="text-slate-400 text-[10px]">{uiText("components_bulk_rename_modal.span.occurrence", "Occurrence:")}</span>
                              <CustomizableLabel
                                labelId="bulk_rename_modal_item_40"
                                as="label"
                                className="flex items-center gap-1 text-slate-300 cursor-pointer"
                              >
                                  {() => (
                                      <>
                                        <input
                                  type="radio"
                                  name="removeTextOccurrence"
                                  checked={removeTextOccurrence === "all"}
                                  onChange={() => setRemoveTextOccurrence("all")}
                                  className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b]"
                                />
                                      <span>{uiText("components_bulk_rename_modal.span.all", "All")}</span>
                                      </>
                                    )}
                              </CustomizableLabel>
                              <CustomizableLabel
                                labelId="bulk_rename_modal_item_39"
                                as="label"
                                className="flex items-center gap-1 text-slate-300 cursor-pointer"
                              >
                                  {() => (
                                      <>
                                        <input
                                  type="radio"
                                  name="removeTextOccurrence"
                                  checked={removeTextOccurrence === "first"}
                                  onChange={() => setRemoveTextOccurrence("first")}
                                  className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b]"
                                />
                                      <span>{uiText("components_bulk_rename_modal.span.first", "First")}</span>
                                      </>
                                    )}
                              </CustomizableLabel>
                              <CustomizableLabel
                                labelId="bulk_rename_modal_item_38"
                                as="label"
                                className="flex items-center gap-1 text-slate-300 cursor-pointer"
                              >
                                  {() => (
                                      <>
                                        <input
                                  type="radio"
                                  name="removeTextOccurrence"
                                  checked={removeTextOccurrence === "last"}
                                  onChange={() => setRemoveTextOccurrence("last")}
                                  className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b]"
                                />
                                      <span>{uiText("components_bulk_rename_modal.span.last", "Last")}</span>
                                      </>
                                    )}
                              </CustomizableLabel>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Target Group Box on the Right */}
                    <div className="border border-[#1e293b] bg-[#090d16] p-2.5 rounded-lg w-full sm:w-28 shrink-0 flex flex-col justify-center space-y-1.5 relative">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-[#1e293b] pb-1 mb-0.5">
                        {uiText("components_bulk_rename_modal.span.target", "Target")}
                      </span>
                      <CustomizableLabel
                        labelId="bulk_rename_modal_item_37"
                        as="label"
                        className="flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer font-medium select-none"
                      >
                          {() => (
                              <>
                                <input
                          type="radio"
                          name="removeTarget"
                          checked={removeTarget === "name"}
                          onChange={() => setRemoveTarget("name")}
                          className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b] cursor-pointer"
                        />
                              <span>{uiText("components_bulk_rename_modal.span.name", "Name")}</span>
                              </>
                            )}
                      </CustomizableLabel>
                      <CustomizableLabel
                        labelId="bulk_rename_modal_item_36"
                        as="label"
                        className="flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer font-medium select-none"
                      >
                          {() => (
                              <>
                                <input
                          type="radio"
                          name="removeTarget"
                          checked={removeTarget === "ext"}
                          onChange={() => setRemoveTarget("ext")}
                          className="text-[#10b981] focus:ring-0 bg-[#020617] border-[#1e293b] cursor-pointer"
                        />
                              <span>{uiText("components_bulk_rename_modal.span.ext", "Ext")}</span>
                              </>
                            )}
                      </CustomizableLabel>
                    </div>
                  </div>

                  {/* Strip Trailing Underscores & Quick Action Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e293b]/60">
                    <CustomizableLabel
                      labelId="bulk_rename_modal_item_35"
                      as="label"
                      className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold cursor-pointer select-none"
                    >
                        {() => (
                            <>
                              <input
                        type="checkbox"
                        checked={stripTrailingUnderscores}
                        onChange={(e) => setStripTrailingUnderscores(e.target.checked)}
                        className="rounded bg-[#020617] border-amber-500 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                            <span>{uiText("components_bulk_rename_modal.span.strip_trailing_or_at_end_of_name", "Strip trailing '__' or '_' at end of name")}</span>
                            </>
                          )}
                    </CustomizableLabel>

                    <div className="flex items-center gap-1.5">
                      <CustomizableButton
                        buttonId="bulk_rename_modal_btn_34"
                        type="button"
onClick={() => {
                          setRemoveMode("text");
                          setRemoveText("__");
                          setRemoveTextOccurrence("all");
                        }}
className="px-2 py-0.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 rounded text-[10.5px] text-rose-300 font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
title={uiText("components_bulk_rename_modal.button.set_text_to_remove_from_all_names.title", "Set text to remove '__' from all names")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_bulk_rename_modal.span.remove", "Remove '__'")}</span>
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="bulk_rename_modal_btn_33"
                        type="button"
onClick={() => {
                          setRemoveMode("position");
                          setRemoveFromDir("end");
                          setRemoveStartPos(1);
                          setRemoveCount(2);
                          setRemoveUntilLast(false);
                        }}
className="px-2 py-0.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 rounded text-[10.5px] text-amber-300 font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
title={uiText("components_bulk_rename_modal.button.set_position_removal_to_2_chars_from_end.title", "Set position removal to 2 chars from end")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_bulk_rename_modal.span.remove_2_from_end", "Remove 2 from end")}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>

                  {/* Live Character Map / Start Position Visual Indicator */}
                  {(() => {
                    const sampleFullName = previewResults[0]?.oldName || slices[0]?.name || "slice-01.png";
                    const extMatch = sampleFullName.match(/(\.[a-zA-Z0-9]{2,5})$/i);
                    const sampleBase = extMatch ? sampleFullName.slice(0, extMatch.index) : sampleFullName;
                    const sampleExt = extMatch ? extMatch[1] : "";
                    const chars = sampleBase.split("");

                    let startIdx = -1;
                    let isTrimmedMap = new Set<number>();

                    if (removeTarget === "name") {
                      const L = chars.length;
                      if (removeMode === "position") {
                        if (removeFromDir === "begin") {
                          startIdx = Math.max(0, Math.min(L - 1, removeStartPos - 1));
                          if (removeUntilLast) {
                            for (let i = startIdx; i < L; i++) isTrimmedMap.add(i);
                          } else if (removeCount > 0) {
                            for (let i = startIdx; i < Math.min(L, startIdx + removeCount); i++) isTrimmedMap.add(i);
                          }
                        } else {
                          const startIdxFromEnd = Math.max(1, Math.min(L, removeStartPos));
                          startIdx = L - startIdxFromEnd;
                          if (removeUntilLast) {
                            for (let i = startIdx; i < L; i++) isTrimmedMap.add(i);
                          } else if (removeCount > 0) {
                            for (let i = startIdx; i < Math.min(L, startIdx + removeCount); i++) isTrimmedMap.add(i);
                          }
                        }
                      } else if (removeMode === "text" && removeText) {
                        const escaped = removeText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                        const flags = removeTextMatchCase ? "g" : "gi";
                        const matches = Array.from(sampleBase.matchAll(new RegExp(escaped, flags)));
                        if (matches.length > 0) {
                          if (removeTextOccurrence === "all") {
                            matches.forEach((m) => {
                              if (m.index !== undefined) {
                                for (let i = m.index; i < m.index + removeText.length; i++) isTrimmedMap.add(i);
                              }
                            });
                          } else if (removeTextOccurrence === "first") {
                            const m = matches[0];
                            if (m.index !== undefined) {
                              for (let i = m.index; i < m.index + removeText.length; i++) isTrimmedMap.add(i);
                            }
                          } else if (removeTextOccurrence === "last") {
                            const m = matches[matches.length - 1];
                            if (m.index !== undefined) {
                              for (let i = m.index; i < m.index + removeText.length; i++) isTrimmedMap.add(i);
                            }
                          }
                        }
                      }
                    }

                    const startChar = chars[startIdx] || "";

                    return (
                      <div className="bg-[#020617] p-2.5 rounded-lg border border-[#1e293b] space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <span>{uiText("components_bulk_rename_modal.span.position_map_preview", "Position Map Preview:")}</span>
                            <span className="font-mono text-slate-500">"{sampleBase}"</span>
                          </span>
                          {removeMode === "position" && startIdx >= 0 && (
                            <span className="text-amber-400 font-bold font-mono bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 text-[9.5px] flex items-center gap-1">
                              <span>{uiText("components_bulk_rename_modal.span.start_pos", "Start Pos ")}{removeStartPos}:</span>
                              <span className="text-amber-300 font-extrabold text-xs underline">
                                {startChar === " " ? "SPACE" : `'${startChar}'`}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
                          {chars.map((ch, i) => {
                            const pos = i + 1;
                            const isStartPos = i === startIdx && removeMode === "position" && removeTarget === "name";
                            const isTrimmed = isTrimmedMap.has(i);

                            return (
                              <div
                                key={i}
                                onClick={() => {
                                  if (removeMode === "position") {
                                    if (removeFromDir === "begin") {
                                      setRemoveStartPos(pos);
                                    } else {
                                      setRemoveStartPos(chars.length - i);
                                    }
                                  }
                                }}
                                className={cn(
                                  "flex flex-col items-center justify-center p-1 rounded min-w-[22px] border transition-all cursor-pointer select-none",
                                  isStartPos
                                    ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/60 scale-105 z-10 shadow-md"
                                    : isTrimmed
                                    ? "bg-rose-950/60 border-rose-800 text-rose-300 line-through opacity-80"
                                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600"
                                )}
                                title={`Position ${pos}: '${ch}' (Click to set as Start Pos)`}
                              >
                                <span className="text-[8px] font-mono text-slate-500 block leading-none">
                                  {pos}
                                </span>
                                <span className={cn("font-mono font-bold text-xs mt-0.5", isStartPos && "text-amber-300 text-sm font-black")}>
                                  {ch === " " ? "␣" : ch}
                                </span>
                              </div>
                            );
                          })}
                          {sampleExt && (
                            <div className={cn(
                              "flex flex-col items-center justify-center p-1 rounded border bg-slate-950 text-slate-500",
                              removeTarget === "ext" ? "border-amber-500/60 text-amber-400 bg-amber-950/20" : "border-slate-800/40 opacity-60"
                            )}>
                              <span className="text-[8px] font-mono block leading-none">{uiText("components_bulk_rename_modal.span.ext_2", "ext")}</span>
                              <span className="font-mono text-[10px] font-bold">{sampleExt}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 2. Quick Defined Keywords Panel */}
            <div className="bg-[#020617]/70 rounded-xl border border-[#1e293b] overflow-hidden transition-all">
              <CustomizableButton
                buttonId="bulk_rename_modal_btn_32"
                type="button"
onClick={() => setPanelKeywordsOpen(!panelKeywordsOpen)}
className="w-full flex items-center justify-between p-3 hover:bg-[#0f172a] transition-colors cursor-pointer text-left select-none"
              >
                  {() => (
                      <>
                        <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[11px] font-bold text-slate-200">
                    {uiText("components_bulk_rename_modal.span.quick_defined_keywords", "Quick Defined Keywords")}
                  </span>
                  {prefix !== "" && (
                    <span className="text-[9.5px] text-[#10b981] font-mono bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/30 font-bold">
                      {uiText("components_bulk_rename_modal.span.active", "Active")}
                    </span>
                  )}
                </div>
                      <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {panelKeywordsOpen ? "Collapse" : "Expand"}
                  </span>
                  {panelKeywordsOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#10b981]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                      </>
                    )}
              </CustomizableButton>

              {panelKeywordsOpen && (
                <div className="p-3 border-t border-[#1e293b] space-y-2 bg-[#020617]/50">
                  <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
                    <span>{uiText("components_bulk_rename_modal.span.click_word_to_insert_as_prefix", "Click word to insert as prefix:")}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFINED_WORDS.map((word) => (
                      <CustomizableButton
                        buttonId="bulk_rename_modal_btn_31"
                        defaultLabel={"+"}
                        key={word}
type="button"
onClick={() => {
                          setPrefix(word ? `${word}_` : "");
                          setPanelPrefixOpen(true);
                        }}
className="px-2 py-1 bg-[#0f172a] hover:bg-[#10b981]/20 hover:text-[#10b981] text-slate-300 border border-[#1e293b] rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer"
                      >
                          {(ibcProps) => (
                              <>
                                {!ibcProps.isTextHidden ? ibcProps.label : null}
                              {word}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Macro Pattern Renaming Panel */}
            <div className="bg-[#020617]/70 rounded-xl border border-[#1e293b] overflow-hidden transition-all">
              <CustomizableButton
                buttonId="bulk_rename_modal_btn_30"
                type="button"
onClick={() => setPanelMacroOpen(!panelMacroOpen)}
className="w-full flex items-center justify-between p-3 hover:bg-[#0f172a] transition-colors cursor-pointer text-left select-none"
              >
                  {() => (
                      <>
                        <div className="flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[11px] font-bold text-slate-200">
                    {uiText("components_bulk_rename_modal.span.macro_pattern_renaming", "Macro Pattern Renaming")}
                  </span>
                  {macroPattern.trim() !== "" && (
                    <span className="text-[9.5px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 font-bold">
                      {uiText("components_bulk_rename_modal.span.macro_active", "Macro Active")}
                    </span>
                  )}
                </div>
                      <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {panelMacroOpen ? "Collapse" : "Expand"}
                  </span>
                  {panelMacroOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#10b981]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                      </>
                    )}
              </CustomizableButton>

              {panelMacroOpen && (
                <div className="p-3 border-t border-[#1e293b] space-y-3 bg-[#020617]/50">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* Left Sub-Section: Macro Input & Tag Buttons */}
                    <div className="sm:col-span-7 space-y-2">
                      <div className="relative">
                        <input
                          ref={macroInputRef}
                          type="text"
                          value={macroPattern}
                          onChange={(e) => setMacroPattern(e.target.value)}
                          placeholder={uiText("components_bulk_rename_modal.input.e_g_n_c_e_or_f_n.placeholder", "e.g. <n>_<c><e> or <f>_<n>")}
                          className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                        />
                      </div>

                      {/* Macro Tag Insertion Buttons */}
                      <div className="flex flex-wrap items-center gap-1">
                        <CustomizableButton
                          buttonId="bulk_rename_modal_btn_29"
                          type="button"
onClick={() => insertMacroTag("<n>")}
className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#10b981]/20 hover:text-[#10b981] border border-[#1e293b] rounded text-xs font-mono font-medium text-slate-200 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.insert_original_name_tag_n.title", "Insert Original Name tag <n>")}
                        >
                            {() => (
                                <>
                                  {uiText("components_bulk_rename_modal.button.name", "Name")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="bulk_rename_modal_btn_28"
                          type="button"
onClick={() => insertMacroTag("<e>")}
className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#10b981]/20 hover:text-[#10b981] border border-[#1e293b] rounded text-xs font-mono font-medium text-slate-200 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.insert_extension_tag_e.title", "Insert Extension tag <e>")}
                        >
                            {() => (
                                <>
                                  {uiText("components_bulk_rename_modal.button.ext", "Ext")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="bulk_rename_modal_btn_27"
                          type="button"
onClick={() => insertMacroTag("<c>")}
className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#10b981]/20 hover:text-[#10b981] border border-[#1e293b] rounded text-xs font-mono font-medium text-slate-200 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.insert_counter_tag_c.title", "Insert Counter tag <c>")}
                        >
                            {() => (
                                <>
                                  {uiText("components_bulk_rename_modal.button.counter", "Counter")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="bulk_rename_modal_btn_26"
                          type="button"
onClick={() => insertMacroTag("<d>")}
className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#10b981]/20 hover:text-[#10b981] border border-[#1e293b] rounded text-xs font-mono font-medium text-slate-200 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.insert_date_tag_d.title", "Insert Date tag <d>")}
                        >
                            {() => (
                                <>
                                  {uiText("components_bulk_rename_modal.button.date", "Date")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="bulk_rename_modal_btn_25"
                          type="button"
onClick={() => insertMacroTag("<f>")}
className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#10b981]/20 hover:text-[#10b981] border border-[#1e293b] rounded text-xs font-mono font-medium text-slate-200 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.insert_folder_tag_f.title", "Insert Folder tag <f>")}
                        >
                            {() => (
                                <>
                                  {uiText("components_bulk_rename_modal.button.folder", "Folder")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="bulk_rename_modal_btn_24"
                          type="button"
onClick={() => setMacroPattern("")}
className="px-2 py-0.5 bg-rose-950/30 hover:bg-rose-900/50 hover:text-rose-200 border border-rose-900/50 rounded text-xs font-mono text-rose-300 transition-all cursor-pointer"
title={uiText("components_bulk_rename_modal.button.clear_macro_pattern.title", "Clear macro pattern")}
                        >
                            {() => (
                                <>
                                  {uiText("components_bulk_rename_modal.button.clear", "Clear")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    </div>

                    {/* Right Sub-Section: Counter Box */}
                    <div className="sm:col-span-5 p-2 bg-[#020617] rounded-lg border border-[#1e293b] space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#1e293b] pb-1">
                        {uiText("components_bulk_rename_modal.div.counter", "Counter")}
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 text-[10.5px]">{uiText("components_bulk_rename_modal.span.start_at_2", "Start At")}</span>
                          <div className="relative flex items-center w-16">
                            <input
                              type="number"
                              min={0}
                              value={macroStartAt}
                              onChange={(e) => setMacroStartAt(parseInt(e.target.value) || 0)}
                              className="w-full bg-[#090d16] border border-[#1e293b] rounded pl-1.5 pr-4 py-0.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-0.5 flex flex-col gap-0.5">
                              <HoldButton
                                onAction={() => setMacroStartAt((v) => v + 1)}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981]"
                              >
                                <ChevronUp className="w-2.5 h-2.5" />
                              </HoldButton>
                              <HoldButton
                                onAction={() => setMacroStartAt((v) => Math.max(0, v - 1))}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981]"
                              >
                                <ChevronDown className="w-2.5 h-2.5" />
                              </HoldButton>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 text-[10.5px]">{uiText("components_bulk_rename_modal.span.increment", "Increment")}</span>
                          <div className="relative flex items-center w-16">
                            <input
                              type="number"
                              min={1}
                              value={macroIncrement}
                              onChange={(e) => setMacroIncrement(parseInt(e.target.value) || 1)}
                              className="w-full bg-[#090d16] border border-[#1e293b] rounded pl-1.5 pr-4 py-0.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-0.5 flex flex-col gap-0.5">
                              <HoldButton
                                onAction={() => setMacroIncrement((v) => v + 1)}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981]"
                              >
                                <ChevronUp className="w-2.5 h-2.5" />
                              </HoldButton>
                              <HoldButton
                                onAction={() => setMacroIncrement((v) => Math.max(1, v - 1))}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981]"
                              >
                                <ChevronDown className="w-2.5 h-2.5" />
                              </HoldButton>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 text-[10.5px]">{uiText("components_bulk_rename_modal.span.digit_s", "Digit(s)")}</span>
                          <div className="relative flex items-center w-16">
                            <input
                              type="number"
                              min={1}
                              max={8}
                              value={macroDigits}
                              onChange={(e) => setMacroDigits(parseInt(e.target.value) || 1)}
                              className="w-full bg-[#090d16] border border-[#1e293b] rounded pl-1.5 pr-4 py-0.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-0.5 flex flex-col gap-0.5">
                              <HoldButton
                                onAction={() => setMacroDigits((v) => Math.min(8, v + 1))}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981]"
                              >
                                <ChevronUp className="w-2.5 h-2.5" />
                              </HoldButton>
                              <HoldButton
                                onAction={() => setMacroDigits((v) => Math.max(1, v - 1))}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981]"
                              >
                                <ChevronDown className="w-2.5 h-2.5" />
                              </HoldButton>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <span className="text-slate-400 text-[10.5px]">{uiText("components_bulk_rename_modal.span.by_folder", "By Folder")}</span>
                          <input
                            type="checkbox"
                            checked={macroByFolder}
                            onChange={(e) => setMacroByFolder(e.target.checked)}
                            className="rounded bg-[#090d16] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Prefix, Suffix & Sequential Indexing Panel */}
            <div className="bg-[#020617]/70 rounded-xl border border-[#1e293b] overflow-hidden transition-all">
              <CustomizableButton
                buttonId="bulk_rename_modal_btn_23"
                type="button"
onClick={() => setPanelPrefixOpen(!panelPrefixOpen)}
className="w-full flex items-center justify-between p-3 hover:bg-[#0f172a] transition-colors cursor-pointer text-left select-none"
              >
                  {() => (
                      <>
                        <div className="flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[11px] font-bold text-slate-200">
                    {uiText("components_bulk_rename_modal.span.prefix_suffix_and_sequential_indexing", "Prefix, Suffix & Sequential Indexing")}
                  </span>
                  {(prefix !== "" || suffix !== "" || addNumbering) && (
                    <span className="text-[9.5px] text-[#10b981] font-mono bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/30 font-bold">
                      {uiText("components_bulk_rename_modal.span.active_2", "Active")}
                    </span>
                  )}
                </div>
                      <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {panelPrefixOpen ? "Collapse" : "Expand"}
                  </span>
                  {panelPrefixOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#10b981]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                      </>
                    )}
              </CustomizableButton>

              {panelPrefixOpen && (
                <div className="p-3 border-t border-[#1e293b] space-y-3 bg-[#020617]/50">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium block">{uiText("components_bulk_rename_modal.span.prefix_before", "Prefix (Before)")}</span>
                      <input
                        type="text"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder={uiText("components_bulk_rename_modal.input.e_g_frame.placeholder", "e.g. frame_")}
                        className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium block">{uiText("components_bulk_rename_modal.span.suffix_after", "Suffix (After)")}</span>
                      <input
                        type="text"
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                        placeholder={uiText("components_bulk_rename_modal.input.e_g_hd.placeholder", "e.g. _hd")}
                        className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                      />
                    </div>
                  </div>

                  {/* Numbering Controls */}
                  <div className="pt-2 border-t border-[#1e293b]/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="bulk_rename_modal_item_22"
                        as="label"
                        className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer select-none"
                      >
                          {() => (
                              <>
                                <input
                          type="checkbox"
                          checked={addNumbering}
                          onChange={(e) => setAddNumbering(e.target.checked)}
                          className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer"
                        />
                              <span>{uiText("components_bulk_rename_modal.span.index_counter_01_02", "Index Counter (_01, _02)")}</span>
                              </>
                            )}
                      </CustomizableLabel>

                      {addNumbering && (
                        <div className="flex items-center bg-[#020617] p-0.5 rounded-lg border border-[#1e293b] text-[10px]">
                          <CustomizableButton
                            buttonId="bulk_rename_modal_btn_21"
                            type="button"
onClick={() => setNumberPosition("end")}
className={cn(
                              "px-2 py-0.5 rounded font-bold cursor-pointer transition-all",
                              numberPosition === "end"
                                ? "bg-[#0f172a] text-[#10b981] border border-[#10b981]/30"
                                : "text-slate-400 hover:text-slate-200"
                            )}
title={uiText("components_bulk_rename_modal.button.append_index_counter_at_end_of_name_before_f.title", "Append index counter at end of name before file extension")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_bulk_rename_modal.button.end_of_name", "End of Name")}
                                  </>
                                )}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="bulk_rename_modal_btn_20"
                            type="button"
onClick={() => setNumberPosition("start")}
className={cn(
                              "px-2 py-0.5 rounded font-bold cursor-pointer transition-all",
                              numberPosition === "start"
                                ? "bg-[#0f172a] text-[#10b981] border border-[#10b981]/30"
                                : "text-slate-400 hover:text-slate-200"
                            )}
title={uiText("components_bulk_rename_modal.button.prepend_index_counter_at_beginning_of_name.title", "Prepend index counter at beginning of name")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_bulk_rename_modal.button.start_of_name", "Start of Name")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      )}
                    </div>

                    {addNumbering && (
                      <div className="grid grid-cols-2 gap-3 pl-5">
                        <div className="space-y-0.5">
                          <span className="text-[9.5px] text-slate-400 block">{uiText("components_bulk_rename_modal.span.start_index", "Start Index:")}</span>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min={0}
                              max={9999}
                              value={numberStart}
                              onChange={(e) => setNumberStart(parseInt(e.target.value) || 0)}
                              className="w-full bg-[#020617] border border-[#1e293b] rounded-lg pl-2 pr-6 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-1 flex flex-col gap-0.5">
                              <HoldButton
                                onAction={() => setNumberStart((v) => Math.min(9999, v + 1))}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                                title={uiText("components_bulk_rename_modal.hold_button.increase_start_index_hold_for_continuous.title", "Increase Start Index (Hold for continuous)")}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </HoldButton>
                              <HoldButton
                                onAction={() => setNumberStart((v) => Math.max(0, v - 1))}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                                title={uiText("components_bulk_rename_modal.hold_button.decrease_start_index_hold_for_continuous.title", "Decrease Start Index (Hold for continuous)")}
                              >
                                <ChevronDown className="w-3 h-3" />
                              </HoldButton>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9.5px] text-slate-400 block">{uiText("components_bulk_rename_modal.span.zero_padding_digits", "Zero Padding Digits:")}</span>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min={1}
                              max={6}
                              value={numberPadding}
                              onChange={(e) => setNumberPadding(parseInt(e.target.value) || 1)}
                              className="w-full bg-[#020617] border border-[#1e293b] rounded-lg pl-2 pr-6 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-1 flex flex-col gap-0.5">
                              <HoldButton
                                onAction={() => setNumberPadding((v) => Math.min(6, v + 1))}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                                title={uiText("components_bulk_rename_modal.hold_button.increase_padding_hold_for_continuous.title", "Increase Padding (Hold for continuous)")}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </HoldButton>
                              <HoldButton
                                onAction={() => setNumberPadding((v) => Math.max(1, v - 1))}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                                title={uiText("components_bulk_rename_modal.hold_button.decrease_padding_hold_for_continuous.title", "Decrease Padding (Hold for continuous)")}
                              >
                                <ChevronDown className="w-3 h-3" />
                              </HoldButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Smart Formatting Panel */}
            <div className="bg-[#020617]/70 rounded-xl border border-[#1e293b] overflow-hidden transition-all">
              <CustomizableButton
                buttonId="bulk_rename_modal_btn_19"
                type="button"
onClick={() => setPanelFormattingOpen(!panelFormattingOpen)}
className="w-full flex items-center justify-between p-3 hover:bg-[#0f172a] transition-colors cursor-pointer text-left select-none"
              >
                  {() => (
                      <>
                        <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[11px] font-bold text-slate-200">
                    {uiText("components_bulk_rename_modal.span.smart_formatting_and_short_form_convert", "Smart Formatting & Short Form Convert")}
                  </span>
                  {(caseFormat !== "none" || applyShortForm) && (
                    <span className="text-[9.5px] text-[#10b981] font-mono bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/30 font-bold">
                      {uiText("components_bulk_rename_modal.span.active_3", "Active")}
                    </span>
                  )}
                </div>
                      <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {panelFormattingOpen ? "Collapse" : "Expand"}
                  </span>
                  {panelFormattingOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#10b981]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                      </>
                    )}
              </CustomizableButton>

              {panelFormattingOpen && (
                <div className="p-3 border-t border-[#1e293b] space-y-2.5 bg-[#020617]/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                    {(["none", "lowercase", "uppercase", "title", "kebab", "snake"] as CaseFormat[]).map(
                      (fmt) => (
                        <CustomizableButton
                          buttonId="bulk_rename_modal_btn_18"
                          key={fmt}
type="button"
onClick={() => setCaseFormat(fmt)}
className={cn(
                            "py-1 px-2 rounded-lg font-mono text-center capitalize transition-all border cursor-pointer",
                            caseFormat === fmt
                              ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 font-bold"
                              : "bg-[#0f172a] text-slate-400 border-[#1e293b] hover:text-slate-200"
                          )}
                        >
                            {() => (
                                <>
                                  {fmt === "none" ? "Original Case" : fmt}
                                </>
                              )}
                        </CustomizableButton>
                      )
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#1e293b]/60">
                    <CustomizableLabel
                      labelId="bulk_rename_modal_item_17"
                      as="label"
                      className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer select-none"
                    >
                        {() => (
                            <>
                              <input
                        type="checkbox"
                        checked={applyShortForm}
                        onChange={(e) => setApplyShortForm(e.target.checked)}
                        className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer"
                      />
                            <span>{uiText("components_bulk_rename_modal.span.auto_shorten_words_e_g_sequence_seq_characte", "Auto Shorten Words (e.g. sequence ➔ seq, character ➔ char)")}</span>
                            </>
                          )}
                    </CustomizableLabel>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Search & Replace Panel */}
            <div className="bg-[#020617]/70 rounded-xl border border-[#1e293b] overflow-hidden transition-all">
              <CustomizableButton
                buttonId="bulk_rename_modal_btn_16"
                type="button"
onClick={() => setPanelSearchReplaceOpen(!panelSearchReplaceOpen)}
className="w-full flex items-center justify-between p-3 hover:bg-[#0f172a] transition-colors cursor-pointer text-left select-none"
              >
                  {() => (
                      <>
                        <div className="flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[11px] font-bold text-slate-200">
                    {uiText("components_bulk_rename_modal.span.search_and_replace", "Search & Replace")}
                  </span>
                  {(findText !== "" || replaceText !== "") && (
                    <span className="text-[9.5px] text-[#10b981] font-mono bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/30 font-bold">
                      {uiText("components_bulk_rename_modal.span.active_4", "Active")}
                    </span>
                  )}
                </div>
                      <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {panelSearchReplaceOpen ? "Collapse" : "Expand"}
                  </span>
                  {panelSearchReplaceOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#10b981]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                      </>
                    )}
              </CustomizableButton>

              {panelSearchReplaceOpen && (
                <div className="p-3 border-t border-[#1e293b] space-y-2.5 bg-[#020617]/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">{uiText("components_bulk_rename_modal.span.find_and_replace_text_or_pattern", "Find & Replace text or pattern:")}</span>
                    <CustomizableLabel
                      labelId="bulk_rename_modal_item_15"
                      as="label"
                      className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer"
                    >
                        {() => (
                            <>
                              <input
                        type="checkbox"
                        checked={useRegex}
                        onChange={(e) => setUseRegex(e.target.checked)}
                        className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0"
                      />
                            <span>{uiText("components_bulk_rename_modal.span.regex_mode", "Regex Mode")}</span>
                            </>
                          )}
                    </CustomizableLabel>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={findText}
                      onChange={(e) => setFindText(e.target.value)}
                      placeholder={useRegex ? "Find regex (e.g. slice-(\\d+))" : "Find text..."}
                      className={cn(
                        "w-full bg-[#020617] border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none",
                        regexError ? "border-rose-500" : "border-[#1e293b] focus:border-[#10b981]"
                      )}
                    />
                    <input
                      type="text"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder={useRegex ? "Replace (e.g. frame_$1)" : "Replace with..."}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                    />
                  </div>

                  {useRegex && (
                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      <CustomizableLabel
                        labelId="bulk_rename_modal_item_14"
                        as="label"
                        className="flex items-center gap-1 cursor-pointer select-none"
                      >
                          {() => (
                              <>
                                <input
                          type="checkbox"
                          checked={regexGlobal}
                          onChange={(e) => setRegexGlobal(e.target.checked)}
                          className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0"
                        />
                              <span>{uiText("components_bulk_rename_modal.span.global_g", "Global (g)")}</span>
                              </>
                            )}
                      </CustomizableLabel>
                      <CustomizableLabel
                        labelId="bulk_rename_modal_item_13"
                        as="label"
                        className="flex items-center gap-1 cursor-pointer select-none"
                      >
                          {() => (
                              <>
                                <input
                          type="checkbox"
                          checked={regexCaseInsensitive}
                          onChange={(e) => setRegexCaseInsensitive(e.target.checked)}
                          className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0"
                        />
                              <span>{uiText("components_bulk_rename_modal.span.case_insensitive_i", "Case Insensitive (i)")}</span>
                              </>
                            )}
                      </CustomizableLabel>
                    </div>
                  )}

                  {regexError && (
                    <div className="flex items-center gap-1.5 p-1.5 bg-rose-950/40 border border-rose-900/60 rounded text-[10px] text-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{regexError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 7. Quick Preset Macros Panel */}
            <div className="bg-[#020617]/70 rounded-xl border border-[#1e293b] overflow-hidden transition-all">
              <CustomizableButton
                buttonId="bulk_rename_modal_btn_12"
                type="button"
onClick={() => setPanelPresetsOpen(!panelPresetsOpen)}
className="w-full flex items-center justify-between p-3 hover:bg-[#0f172a] transition-colors cursor-pointer text-left select-none"
              >
                  {() => (
                      <>
                        <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[11px] font-bold text-slate-200">
                    {uiText("components_bulk_rename_modal.span.preset_macros", "Preset Macros")}
                  </span>
                </div>
                      <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {panelPresetsOpen ? "Collapse" : "Expand"}
                  </span>
                  {panelPresetsOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#10b981]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                      </>
                    )}
              </CustomizableButton>

              {panelPresetsOpen && (
                <div className="p-3 border-t border-[#1e293b] space-y-2 bg-[#020617]/50">
                  <div className="text-[9.5px] text-slate-400 font-mono">{uiText("components_bulk_rename_modal.div.click_to_apply_template_rule", "Click to apply template rule:")}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CustomizableButton
                      buttonId="bulk_rename_modal_btn_11"
                      type="button"
onClick={() => {
                        applyPresetMacro("frame");
                        setPanelPrefixOpen(true);
                      }}
className="px-2.5 py-1 bg-[#0f172a] hover:bg-[#10b981]/20 text-slate-300 hover:text-[#10b981] border border-[#1e293b] rounded-lg text-xs font-mono font-bold cursor-pointer transition-all"
                    >
                        {() => (
                            <>
                              {uiText("components_bulk_rename_modal.button.frame_01", "frame_01")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="bulk_rename_modal_btn_10"
                      type="button"
onClick={() => {
                        applyPresetMacro("panel");
                        setPanelPrefixOpen(true);
                      }}
className="px-2.5 py-1 bg-[#0f172a] hover:bg-[#10b981]/20 text-slate-300 hover:text-[#10b981] border border-[#1e293b] rounded-lg text-xs font-mono font-bold cursor-pointer transition-all"
                    >
                        {() => (
                            <>
                              {uiText("components_bulk_rename_modal.button.panel_01", "panel_01")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="bulk_rename_modal_btn_9"
                      type="button"
onClick={() => {
                        applyPresetMacro("strip");
                        setPanelPrefixOpen(true);
                      }}
className="px-2.5 py-1 bg-[#0f172a] hover:bg-[#10b981]/20 text-slate-300 hover:text-[#10b981] border border-[#1e293b] rounded-lg text-xs font-mono font-bold cursor-pointer transition-all"
                    >
                        {() => (
                            <>
                              {uiText("components_bulk_rename_modal.button.strip_01", "strip_01")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Draggable Vertical Partition Divider (Side-by-Side mode) */}
          {previewLayoutMode === "split-v" && isDesktop && (
            <div
              onMouseDown={() => setIsDraggingDivider(true)}
              onTouchStart={() => setIsDraggingDivider(true)}
              onDoubleClick={() => setLeftPanelWidth(55)}
              className={cn(
                "hidden md:flex w-2.5 bg-[#1e293b]/80 hover:bg-[#10b981] active:bg-[#10b981] cursor-col-resize items-center justify-center transition-colors group shrink-0 select-none z-10 border-x border-[#0b1329] h-full",
                isDraggingDivider && "bg-[#10b981]"
              )}
              title={uiText("components_bulk_rename_modal.div.drag_left_or_right_to_adjust_panel_sizes_dou.title", "Drag left or right to adjust panel sizes (Double-click to reset)")}
            >
              <GripVertical className={cn(
                "w-3.5 h-3.5 text-slate-500 group-hover:text-slate-950 transition-colors pointer-events-none",
                isDraggingDivider && "text-slate-950"
              )} />
            </div>
          )}

          {/* Draggable Horizontal Partition Divider (Horizontal Split mode or Mobile stacked) */}
          {(previewLayoutMode === "split-h" || (!isDesktop && previewLayoutMode === "split-v")) && (
            <div
              onMouseDown={() => setIsDraggingDividerH(true)}
              onTouchStart={() => setIsDraggingDividerH(true)}
              onDoubleClick={() => setTopPanelHeight(50)}
              className={cn(
                "flex h-2.5 bg-[#1e293b]/80 hover:bg-[#10b981] active:bg-[#10b981] cursor-row-resize items-center justify-center transition-colors group shrink-0 select-none z-10 border-y border-[#0b1329] w-full",
                isDraggingDividerH && "bg-[#10b981]"
              )}
              title={uiText("components_bulk_rename_modal.div.drag_up_or_down_to_adjust_top_and_bottom_pan.title", "Drag up or down to adjust top and bottom panel sizes (Double-click to reset)")}
            >
              <GripHorizontal className={cn(
                "w-3.5 h-3.5 text-slate-500 group-hover:text-slate-950 transition-colors pointer-events-none",
                isDraggingDividerH && "text-slate-950"
              )} />
            </div>
          )}

          {/* Live Preview Column */}
          <div
            style={
              previewLayoutMode === "split-h"
                ? { height: `${100 - topPanelHeight}%` }
                : previewLayoutMode === "split-v" && isDesktop
                ? { width: `${100 - leftPanelWidth}%` }
                : { height: `${100 - topPanelHeight}%` }
            }
            className={cn(
              "p-4 flex flex-col space-y-3 bg-[#070d1e]/80 overflow-y-auto transition-all flex-1 min-h-0 min-w-0 w-full",
              previewLayoutMode === "split-v" && isDesktop ? "h-full" : ""
            )}
          >
            {/* Live Preview Header & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CustomizableLabel
                  labelId="bulk_rename_modal_item_8"
                  as="h3"
                  className="text-xs font-bold text-slate-200 flex items-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_bulk_rename_modal.h3.live_slices_preview", "Live Slices Preview")}
                        <span className="text-[10px] font-mono text-[#10b981]">
                    ({previewResults.length}{uiText("components_bulk_rename_modal.span.items", " items)")}
                  </span>
                        </>
                      )}
                </CustomizableLabel>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Auto Numbering toggle button */}
                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_7"
                  defaultIcon={<Hash className="w-3 h-3 text-[#10b981]" />}
                  type="button"
onClick={() => setAddNumbering(!addNumbering)}
className={cn(
                    "px-2 py-1 text-[10px] rounded border transition-colors flex items-center gap-1 cursor-pointer font-medium",
                    addNumbering
                      ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40"
                      : "bg-[#020617] text-slate-400 border-[#1e293b] hover:text-slate-200"
                  )}
title={uiText("components_bulk_rename_modal.button.toggle_sequential_auto_numbering_01_02_for_r.title", "Toggle sequential auto-numbering (_01, _02...) for reordered sequence")}
                >
                    {() => (
                        <>
                          <span>{addNumbering ? "Auto # On" : "+ Add #"}</span>
                        </>
                      )}
                </CustomizableButton>

                {/* Cycle Preview Layout Button */}
                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_6"
                  type="button"
onClick={() => {
                    setPreviewLayoutMode((prev) => {
                      if (prev === "split-v") return "split-h";
                      if (prev === "split-h") return "full";
                      return "split-v";
                    });
                  }}
className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm",
                    previewLayoutMode === "full"
                      ? "bg-[#10b981] text-[#020617] border-emerald-400 font-extrabold"
                      : previewLayoutMode === "split-h"
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-700/80"
                      : "bg-[#0f172a] text-slate-300 hover:text-white border-[#1e293b]"
                  )}
title={`Current Layout: ${
                    previewLayoutMode === "split-v"
                      ? "Side-by-Side (Click to cycle to Horizontal Split)"
                      : previewLayoutMode === "split-h"
                      ? "Horizontal Split (Click to cycle to Full Screen)"
                      : "Full Screen (Click to cycle to Side-by-Side)"
                  }`}
                >
                    {() => (
                        <>
                          {previewLayoutMode === "split-v" && (
                    <>
                      <Columns2 className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>{uiText("components_bulk_rename_modal.span.side_by_side", "Side-by-Side")}</span>
                    </>
                  )}
                        {previewLayoutMode === "split-h" && (
                    <>
                      <Rows2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{uiText("components_bulk_rename_modal.span.horizontal_split", "Horizontal Split")}</span>
                    </>
                  )}
                        {previewLayoutMode === "full" && (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-[#020617]" />
                      <span>{uiText("components_bulk_rename_modal.span.full_screen", "Full Screen")}</span>
                    </>
                  )}
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="bulk_rename_modal_btn_5"
                  defaultIcon={<RefreshCw className="w-3 h-3" />}
                  type="button"
onClick={handleResetAll}
className="p-1 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-[#1e293b] flex items-center gap-1 cursor-pointer"
title={uiText("components_bulk_rename_modal.button.reset_all_settings.title", "Reset all settings")}
                >
                    {() => (
                        <>
                          {uiText("components_bulk_rename_modal.button.reset", "Reset")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {/* Duplicate warning alert */}
            {duplicateCount > 0 && (
              <div className="flex items-center gap-1.5 p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[10px] text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {uiText("components_bulk_rename_modal.span.warning", "Warning: ")}{duplicateCount}{uiText("components_bulk_rename_modal.span.duplicate_filename_s_would_be_created_with_c", " duplicate filename(s) would be created with current rules. Consider adding an index counter.")}
                </span>
              </div>
            )}

            {/* Filter Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={previewFilter}
                onChange={(e) => setPreviewFilter(e.target.value)}
                placeholder={uiText("components_bulk_rename_modal.input.filter_previews_by_name.placeholder", "Filter previews by name...")}
                className="w-full bg-[#020617] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
              />
            </div>

            {/* Scrollable Comparison List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700 min-h-[180px]">
              {filteredPreview.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  {uiText("components_bulk_rename_modal.div.no_slices_match_search_scope", "No slices match search scope.")}
                </div>
              ) : (
                filteredPreview.map((item, idx) => {
                  const isBeingDragged = draggedStudioIdx === idx;
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/x-studio-item-idx", String(idx));
                        setDraggedStudioIdx(idx);
                      }}
                      onDragEnd={() => setDraggedStudioIdx(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIdxStr = e.dataTransfer.getData("application/x-studio-item-idx");
                        if (fromIdxStr !== "" && fromIdxStr !== null && fromIdxStr !== undefined) {
                          const fromIdx = parseInt(fromIdxStr, 10);
                          if (!isNaN(fromIdx) && fromIdx !== idx) {
                            handleReorderStudioItems(fromIdx, idx);
                          }
                        }
                        setDraggedStudioIdx(null);
                      }}
                      className={cn(
                        "p-2 bg-[#020617] border border-[#1e293b] rounded-lg flex items-center gap-2 transition-all hover:border-[#10b981]/40 group",
                        isBeingDragged && "opacity-40 ring-2 ring-emerald-500 border-emerald-[#10b981]"
                      )}
                    >
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-[#10b981] p-0.5">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Image Thumbnail */}
                      <div className="w-9 h-9 bg-slate-950 rounded border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={item.url} alt={item.newName} className="w-full h-full object-cover" />
                      </div>

                      {/* Details & Rename mapping */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span>#{idx + 1}</span>
                          {item.isModified ? (
                            <span className="text-[#10b981] font-bold">{uiText("components_bulk_rename_modal.span.modified", "Modified")}</span>
                          ) : (
                            <span>{uiText("components_bulk_rename_modal.span.unchanged", "Unchanged")}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <div className="truncate max-w-[45%]" title={item.oldName}>
                            {renderHighlightedName(item.oldName)}
                          </div>
                          <ArrowRight className="w-3 h-3 text-[#10b981] shrink-0" />
                          <span
                            className={cn(
                              "truncate font-bold flex-1",
                              item.isModified ? "text-[#10b981]" : "text-slate-300"
                            )}
                            title={item.newName}
                          >
                            {item.newName}
                          </span>
                        </div>
                      </div>

                      {/* Delete Frame Button */}
                      <CustomizableButton
                        buttonId="bulk_rename_modal_btn_4"
                        defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                        type="button"
onClick={() => handleDeleteStudioItem(item.url)}
className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-800/40"
title={uiText("components_bulk_rename_modal.button.delete_this_frame_from_sequence.title", "Delete this frame from sequence")}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Sync Storyboard Option */}
            <div className="pt-2 border-t border-[#1e293b]">
              <CustomizableLabel
                labelId="bulk_rename_modal_item_3"
                as="label"
                className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none"
              >
                  {() => (
                      <>
                        <input
                  type="checkbox"
                  checked={syncBoardSlots}
                  onChange={(e) => setSyncBoardSlots(e.target.checked)}
                  className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer"
                />
                      <span>{uiText("components_bulk_rename_modal.span.sync_names_with_filled_storyboard_slots", "Sync names with filled Storyboard slots")}</span>
                      </>
                    )}
              </CustomizableLabel>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-[#0f172a] border-t border-[#1e293b] flex items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400">
            {uiText("components_bulk_rename_modal.div.targeting", "Targeting: ")}<strong className="text-slate-200">{previewResults.length}</strong>{uiText("components_bulk_rename_modal.div.assets", " assets")}
          </div>

          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="bulk_rename_modal_btn_2"
              type="button"
onClick={onClose}
className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_bulk_rename_modal.button.cancel", "Cancel")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="bulk_rename_modal_btn_1"
              defaultIcon={<Check className="w-4 h-4" />}
              type="button"
onClick={handleApply}
disabled={previewResults.length === 0 || (useRegex && !!regexError)}
className="px-5 py-1.5 bg-[#10b981] hover:bg-emerald-400 text-[#020617] font-bold rounded-lg transition-all flex items-center gap-1.5 text-xs shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {() => (
                    <>
                      <span>{uiText("components_bulk_rename_modal.span.apply_studio_renaming", "Apply Studio Renaming")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        {appliedNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#10b981] text-[#020617] px-4 py-2 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>{appliedNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
};
