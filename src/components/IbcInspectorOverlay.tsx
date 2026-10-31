import React, { useState, useEffect, useCallback, useRef } from "react";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import { BUTTON_DEFINITIONS } from "../types/buttonCustomization";
import { Search, X, Check, ExternalLink, SlidersHorizontal, Eye } from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableButton } from "./CustomizableButton";

interface InspectedTarget {
  id: string;
  type: string;
  title: string;
  rect: DOMRect;
  domElement: HTMLElement;
  hasNativeIbc: boolean;
}

function isInsideIbcEditorUi(element: HTMLElement | null): boolean {
  if (!element) return false;
  return Boolean(element.closest("#ibc-inspector-toolbar, [data-ibc-ui='true']"));
}

export function IbcInspectorOverlay() {
  const {
    isIbcInspectorActive,
    toggleIbcInspector,
    openStudioModal,
    getDefinition,
  } = useButtonCustomization();

  const [hoveredTarget, setHoveredTarget] = useState<InspectedTarget | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [keepPinned, setKeepPinned] = useState<boolean>(false);
  const [pickedTargets, setPickedTargets] = useState<InspectedTarget[]>([]);
  const pickedTargetsRef = useRef<InspectedTarget[]>([]);
  pickedTargetsRef.current = pickedTargets;
  const lastTargetRef = useRef<HTMLElement | null>(null);

  // Helper to determine the best IBC ID and component type for any element
  const resolveIbcElement = useCallback((element: HTMLElement | null): InspectedTarget | null => {
    if (
      !element ||
      element === document.body ||
      element === document.documentElement ||
      isInsideIbcEditorUi(element)
    ) {
      return null;
    }

    // Check if element or ancestor has data-ibc-id
    const ibcContainer = element.closest("[data-ibc-id]") as HTMLElement | null;
    if (ibcContainer && !isInsideIbcEditorUi(ibcContainer)) {
      const id = ibcContainer.getAttribute("data-ibc-id") || "";
      const type = ibcContainer.getAttribute("data-ibc-type") || "component";
      const isRuntime = ibcContainer.getAttribute("data-ibc-runtime") === "true";
      const title =
        ibcContainer.getAttribute("data-ibc-title") ||
        ibcContainer.getAttribute("title") ||
        getDefinition(id)?.defaultLabel ||
        id;
      return {
        id,
        type,
        title,
        rect: ibcContainer.getBoundingClientRect(),
        domElement: ibcContainer,
        hasNativeIbc: !isRuntime,
      };
    }

    // Check if element has an ID matching a known button or component definition
    let el: HTMLElement | null = element;
    while (el && el !== document.body) {
      if (el.id) {
        const foundDef = BUTTON_DEFINITIONS.find((b) => b.id === el?.id);
        if (foundDef) {
          return {
            id: foundDef.id,
            type: foundDef.componentType || "button",
            title: foundDef.defaultLabel || foundDef.description || foundDef.id,
            rect: el.getBoundingClientRect(),
            domElement: el,
            hasNativeIbc: false,
          };
        }
      }
      el = el.parentElement;
    }

    // Fallback: If it's a button or interactive element, create or infer a stable ID
    const clickable = element.closest("button, [role='button'], [role='tab'], input, select, header, aside, nav") as HTMLElement | null;
    if (clickable && !isInsideIbcEditorUi(clickable)) {
      const origLabel = clickable.getAttribute("data-ibc-orig-label") || clickable.innerText?.trim().slice(0, 24) || "";
      const generatedId =
        clickable.id ||
        clickable.getAttribute("aria-label") ||
        clickable.title ||
        origLabel ||
        "element";
      const cleanId = generatedId.toLowerCase().replace(/[^a-z0-9_\-]/g, "_").replace(/^_+|_+$/g, "") || "element";
      return {
        id: cleanId,
        type: clickable.tagName.toLowerCase(),
        title: clickable.title || origLabel || cleanId,
        rect: clickable.getBoundingClientRect(),
        domElement: clickable,
        hasNativeIbc: false,
      };
    }

    return null;
  }, [getDefinition]);

  // Global mousemove and click tracking when inspector is active
  useEffect(() => {
    if (!isIbcInspectorActive) {
      setHoveredTarget((prev) => (prev === null ? prev : null));
      setPickedTargets((prev) => (prev.length === 0 ? prev : []));
      lastTargetRef.current = null;
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!target || isInsideIbcEditorUi(target)) {
        lastTargetRef.current = null;
        setHoveredTarget((prev) => (prev === null ? prev : null));
        return;
      }

      if (target === lastTargetRef.current) return;
      lastTargetRef.current = target;

      const resolved = resolveIbcElement(target);
      setHoveredTarget(resolved);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (isInsideIbcEditorUi(target)) {
        return; // Never block clicks inside IBC customizer modal, context menu, or color dial
      }

      const resolved = resolveIbcElement(target);
      if (resolved) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Stamp runtime non-IBC DOM elements so property edits apply live to them as well
        if (!resolved.hasNativeIbc && resolved.domElement) {
          if (!resolved.domElement.hasAttribute("data-ibc-orig-label")) {
            resolved.domElement.setAttribute(
              "data-ibc-orig-label",
              resolved.domElement.innerText?.trim() || ""
            );
          }
          resolved.domElement.setAttribute("data-ibc-id", resolved.id);
          resolved.domElement.setAttribute("data-ibc-runtime", "true");
        }

        // Shift+Click or Ctrl/Cmd+Click toggles multi-selection on the workspace without leaving Inspector Mode
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          setPickedTargets((prev) => {
            const exists = prev.some((item) => item.id === resolved.id);
            if (exists) {
              return prev.filter((item) => item.id !== resolved.id);
            }
            return [...prev, resolved];
          });
          return;
        }

        // Normal click: open customizer drawer for this element (plus any Shift-selected items)
        const currentPicked = pickedTargetsRef.current;
        const combinedIds =
          currentPicked.length > 0
            ? Array.from(new Set([...currentPicked.map((t) => t.id), resolved.id]))
            : [resolved.id];
        openStudioModal(resolved.id, combinedIds);

        // Exit capture mode automatically so user can immediately edit in the customizer
        if (!keepPinned) {
          toggleIbcInspector(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toggleIbcInspector(false);
      } else if (e.key === "Enter" && pickedTargetsRef.current.length > 0) {
        e.preventDefault();
        const ids = pickedTargetsRef.current.map((t) => t.id);
        openStudioModal(ids[ids.length - 1], ids);
        if (!keepPinned) {
          toggleIbcInspector(false);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isIbcInspectorActive, keepPinned, resolveIbcElement, openStudioModal, toggleIbcInspector]);

  // Keyboard shortcut Alt+I to toggle inspector at any time
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        toggleIbcInspector(!isIbcInspectorActive);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [isIbcInspectorActive, toggleIbcInspector]);

  if (!isIbcInspectorActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden select-none">
      {/* Floating Toolbar Header */}
      <div
        id="ibc-inspector-toolbar"
        data-ibc-ui="true"
        className="pointer-events-auto fixed top-3 left-1/2 -translate-x-1/2 bg-slate-950/95 text-slate-100 border-2 border-cyan-500 shadow-[0_0_24px_rgba(6,182,212,0.4)] backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              {uiText("components_ibc_inspector_overlay.span.ibc_inspector_mode", "IBC Inspector Mode")}
            </span>
            <span className="text-[10px] text-slate-400">
              {uiText("components_ibc_inspector_overlay.span.click_to_edit_shift_click_to_multi_select", "Click to edit · Shift+Click to multi-select")}
            </span>
          </div>
        </div>

        {hoveredTarget && (
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold text-[11px]">
              {hoveredTarget.id}
            </span>
            <span className="text-slate-300 font-medium max-w-[140px] truncate">
              {hoveredTarget.title}
            </span>
          </div>
        )}

        {pickedTargets.length > 0 && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <CustomizableButton
              buttonId="ibc_inspector_overlay_btn_4"
              defaultIcon={<Check className="w-3 h-3 stroke-[3]" />}
              type="button"
onClick={() => {
                const ids = pickedTargets.map((t) => t.id);
                openStudioModal(ids[ids.length - 1], ids);
                if (!keepPinned) {
                  toggleIbcInspector(false);
                }
              }}
className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-[10.5px] flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
title={uiText("components_ibc_inspector_overlay.button.open_customizer_to_edit_all_selected_element.title", "Open customizer to edit all selected elements together (Enter)")}
            >
                {() => (
                    <>
                      <span>{uiText("components_ibc_inspector_overlay.span.edit", "Edit ")}{pickedTargets.length}{uiText("components_ibc_inspector_overlay.span.selected", " Selected")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="ibc_inspector_overlay_btn_3"
              type="button"
onClick={() => setPickedTargets([])}
className="px-1.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-[10px] font-mono font-bold cursor-pointer"
title={uiText("components_ibc_inspector_overlay.button.clear_multi_selected_elements.title", "Clear multi-selected elements")}
            >
                {() => (
                    <>
                      {uiText("components_ibc_inspector_overlay.button.clear", "Clear")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        )}

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <CustomizableButton
            buttonId="ibc_inspector_overlay_btn_2"
            type="button"
onClick={() => setKeepPinned((p) => !p)}
className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer",
              keepPinned
                ? "bg-cyan-500 text-slate-950 border-cyan-300"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
            )}
title={uiText("components_ibc_inspector_overlay.button.when_pinned_inspector_mode_stays_active_afte.title", "When pinned, Inspector Mode stays active after clicking an element")}
          >
              {() => (
                  <>
                    {keepPinned ? "Pinned" : "Auto-Edit"}
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="ibc_inspector_overlay_btn_1"
            defaultIcon={<X className="w-4 h-4" />}
            type="button"
onClick={() => toggleIbcInspector(false)}
className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500 transition-colors cursor-pointer"
title={uiText("components_ibc_inspector_overlay.button.exit_inspector_esc.title", "Exit Inspector (Esc)")}
          />
        </div>
      </div>

      {/* Persistent Highlight Boxes around Shift-Selected Elements */}
      {pickedTargets.map((item, idx) => {
        const rect = item.domElement?.isConnected ? item.domElement.getBoundingClientRect() : item.rect;
        return (
          <div
            key={item.id}
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
            className="fixed border-2 border-emerald-400 bg-emerald-400/15 pointer-events-none z-[999989] rounded-sm shadow-[0_0_12px_rgba(16,185,129,0.4)]"
          >
            <span className="absolute -top-4 left-0 px-1 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-mono font-black leading-tight">
              #{idx + 1}
            </span>
          </div>
        );
      })}

      {/* Highlight Box around Hovered Element */}
      {hoveredTarget && (
        <div
          style={{
            top: `${hoveredTarget.rect.top}px`,
            left: `${hoveredTarget.rect.left}px`,
            width: `${hoveredTarget.rect.width}px`,
            height: `${hoveredTarget.rect.height}px`,
          }}
          className="fixed border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none transition-all duration-75 shadow-[0_0_16px_rgba(6,182,212,0.4)] z-[999990] rounded-sm"
        >
          {/* Corner accent brackets */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400" />
        </div>
      )}

      {/* Floating Info Tooltip near Cursor */}
      {hoveredTarget && (
        <div
          style={{
            top: `${Math.min(window.innerHeight - 110, mousePos.y + 16)}px`,
            left: `${Math.min(window.innerWidth - 260, mousePos.x + 16)}px`,
          }}
          className="fixed pointer-events-none z-[999995] bg-slate-950/95 border border-cyan-500/80 shadow-2xl rounded-xl p-2.5 text-xs text-slate-200 backdrop-blur-md min-w-[220px] max-w-[320px] animate-in fade-in duration-100"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="font-mono font-bold text-cyan-300 text-[11px] truncate">
              {hoveredTarget.id}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400">
              {hoveredTarget.type}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-slate-200 truncate mb-1">
            {hoveredTarget.title}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <SlidersHorizontal className="w-3 h-3" />
              {uiText("components_ibc_inspector_overlay.span.click_to_edit_shift_click_to_add", "Click to edit · Shift+Click to add")}
            </span>
            <span className="text-slate-500">
              {Math.round(hoveredTarget.rect.width)}×{Math.round(hoveredTarget.rect.height)}{uiText("components_ibc_inspector_overlay.span.px", "px")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
