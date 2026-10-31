import React, { useRef, useEffect } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Wand2, X, RefreshCw, Grid, RotateCcw, FlipHorizontal, FlipVertical,
  Check, Camera, Trash2, Layout, ImageIcon, Lightbulb, MessageSquare
} from "lucide-react";
import { uiText } from "../../hooks/useUIConfig";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

export const ShaperPreview = React.forwardRef<HTMLCanvasElement, { image: string; panels: any[] }>(({ image, panels }, ref) => {
  const localRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = (ref as React.RefObject<HTMLCanvasElement>) || localRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => {
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const count = panels.length || 1;
      const cols = count <= 3 ? count : Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      panels.forEach((panel, index) => {
        const [ymin, xmin, ymax, xmax] = panel.box_2d || [0, 0, 1000, 1000];
        const sx = (xmin / 1000) * img.width;
        const sy = (ymin / 1000) * img.height;
        const sw = ((xmax - xmin) / 1000) * img.width;
        const sh = ((ymax - ymin) / 1000) * img.height;

        const dx = (index % cols) * cellWidth;
        const dy = Math.floor(index / cols) * cellHeight;

        const padding = 6;
        const targetW = cellWidth - padding * 2;
        const targetH = cellHeight - padding * 2;

        const ratio = Math.min(targetW / sw, targetH / sh);
        const finalW = sw * ratio;
        const finalH = sh * ratio;
        const finalX = dx + padding + (targetW - finalW) / 2;
        const finalY = dy + padding + (targetH - finalH) / 2;

        ctx.save();
        ctx.translate(finalX + finalW / 2, finalY + finalH / 2);
        ctx.scale(panel.flipH ? -1 : 1, panel.flipV ? -1 : 1);
        if (panel.rotate) ctx.rotate((panel.rotate * Math.PI) / 180);
        const zoom = panel.zoom || 1;
        ctx.scale(zoom, zoom);

        ctx.beginPath();
        ctx.rect(-finalW / 2, -finalH / 2, finalW, finalH);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, -finalW / 2, -finalH / 2, finalW, finalH);
        ctx.restore();

        ctx.fillStyle = "rgba(217, 70, 239, 0.9)";
        ctx.fillRect(finalX, finalY, 44, 18);
        ctx.fillStyle = "white";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(panel.label || `P${index + 1}`, finalX + 5, finalY + 13);
      });
    };
  }, [image, panels]);

  return (
    <div className="w-full h-full flex items-center justify-center p-3 bg-zinc-950/60 backdrop-blur-sm">
      <canvas ref={canvasRef} className="max-w-full max-h-full rounded-xl shadow-2xl border border-zinc-800" />
    </div>
  );
});

export const SortableShaperPanel = ({ panel, index, onUpdate }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: panel.label });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 space-y-2 hover:border-fuchsia-500/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-800 rounded text-zinc-500">
            <Grid className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-zinc-200">{panel.label}</span>
        </div>
        <span className="text-[9px] text-zinc-500 font-mono">#{index + 1}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[9px]">
        <div>
          <CustomizableLabel
            labelId="imgdesc_shaper_modal_item_13"
            as="label"
            className="text-zinc-500 block mb-0.5"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_shaper_modal.label.zoom", "Zoom ")}
                  {(panel.zoom || 1).toFixed(1)}
                  {uiText("components_imgdesc_shaper_modal.label.x", "x")}
                  </>
                )}
          </CustomizableLabel>
          <input
            type="range" min="0.5" max="2" step="0.1"
            value={panel.zoom || 1}
            onChange={(e) => onUpdate(panel.label, { zoom: parseFloat(e.target.value) })}
            className="w-full accent-fuchsia-500"
          />
        </div>
        <div>
          <CustomizableLabel
            labelId="imgdesc_shaper_modal_item_12"
            as="label"
            className="text-zinc-500 block mb-0.5"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_shaper_modal.label.rotate", "Rotate")}
                  </>
                )}
          </CustomizableLabel>
          <CustomizableButton
            buttonId="imgdesc_shaper_modal_btn_11"
            defaultLabel={"°"}
            defaultIcon={<RotateCcw className="w-2.5 h-2.5" />}
            onClick={() => onUpdate(panel.label, { rotate: ((panel.rotate || 0) + 90) % 360 })}
className="w-full py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center gap-1 text-[10px]"
          >
              {(ibcProps) => (
                  <>
                    {(panel.rotate || 0)}
                  {!ibcProps.isTextHidden ? ibcProps.label : null}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>

      <div className="flex gap-1 text-[9px]">
        <CustomizableButton
          buttonId="imgdesc_shaper_modal_btn_10"
          defaultIcon={<FlipHorizontal className="w-3 h-3" />}
          onClick={() => onUpdate(panel.label, { flipH: !panel.flipH })}
className={`flex-1 py-1 rounded flex items-center justify-center gap-1 border ${panel.flipH ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
        >
            {() => (
                <>
                  {uiText("components_imgdesc_shaper_modal.button.flip_h", " Flip H")}
                </>
              )}
        </CustomizableButton>
        <CustomizableButton
          buttonId="imgdesc_shaper_modal_btn_9"
          defaultIcon={<FlipVertical className="w-3 h-3" />}
          onClick={() => onUpdate(panel.label, { flipV: !panel.flipV })}
className={`flex-1 py-1 rounded flex items-center justify-center gap-1 border ${panel.flipV ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
        >
            {() => (
                <>
                  {uiText("components_imgdesc_shaper_modal.button.flip_v", " Flip V")}
                </>
              )}
        </CustomizableButton>
      </div>
    </div>
  );
};

export const FrameShaperModal = ({
  isOpen, onClose, shaperImage, detectedPanels, setDetectedPanels,
  isDetectingPanels, onApplyShapedImage, onKeepImage
}: any) => {
  const [showPreview, setShowPreview] = React.useState(false);
  const [instructions, setInstructions] = React.useState("");
  const [isApplying, setIsApplying] = React.useState(false);
  const shaperCanvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDetectedPanels((items: any[]) => {
        const oldIndex = items.findIndex((item) => item.label === active.id);
        const newIndex = items.findIndex((item) => item.label === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        setInstructions(`Reordered sequence: ${reordered.map((p) => p.label).join(", ")}`);
        return reordered;
      });
      setShowPreview(true);
    }
  };

  const handleUpdate = (label: string, updates: any) => {
    setDetectedPanels((prev: any[]) => prev.map((p) => p.label === label ? { ...p, ...updates } : p));
    setShowPreview(true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="imgdesc_shaper_modal_item_8"
                as="h2"
                className="text-base font-bold text-zinc-100"
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_shaper_modal.h2.frame_shaper_studio", "Frame Shaper Studio")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[11px] text-zinc-400">{uiText("components_imgdesc_shaper_modal.p.detect_reorder_scale_and_transform_individua", "Detect, reorder, scale and transform individual comic panels")}</p>
            </div>
          </div>
          <CustomizableButton
            buttonId="imgdesc_shaper_modal_btn_7"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden aspect-video flex items-center justify-center">
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <CustomizableButton
                buttonId="imgdesc_shaper_modal_btn_6"
                onClick={() => setShowPreview(false)}
className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${!showPreview ? "bg-fuchsia-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_shaper_modal.button.original", "Original")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="imgdesc_shaper_modal_btn_5"
                onClick={() => setShowPreview(true)}
className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${showPreview ? "bg-fuchsia-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_shaper_modal.button.layout_preview", "Layout Preview")}
                      </>
                    )}
              </CustomizableButton>
            </div>

            {shaperImage && (
              !showPreview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={shaperImage} alt={uiText("components_imgdesc_shaper_modal.img.source.alt", "Source")} className="max-w-full max-h-full object-contain" />
                  {!isDetectingPanels && detectedPanels.map((p: any, idx: number) => {
                    const [ymin, xmin, ymax, xmax] = p.box_2d || [0, 0, 1000, 1000];
                    return (
                      <div
                        key={idx}
                        className="absolute border-2 border-fuchsia-500/70 bg-fuchsia-500/15 pointer-events-none flex items-start p-1"
                        style={{ top: `${ymin / 10}%`, left: `${xmin / 10}%`, width: `${(xmax - xmin) / 10}%`, height: `${(ymax - ymin) / 10}%` }}
                      >
                        <span className="bg-fuchsia-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ShaperPreview ref={shaperCanvasRef} image={shaperImage} panels={detectedPanels} />
              )
            )}
          </div>

          {detectedPanels.length > 0 && (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={detectedPanels.map((p: any) => p.label)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {detectedPanels.map((panel: any, idx: number) => (
                    <SortableShaperPanel key={panel.label} panel={panel} index={idx} onUpdate={handleUpdate} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="space-y-1.5">
            <CustomizableLabel
              labelId="imgdesc_shaper_modal_item_4"
              defaultIcon={<MessageSquare className="w-3.5 h-3.5 text-fuchsia-400" />}
              as="label"
              className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_shaper_modal.label.shaping_prompt_instructions", " Shaping Prompt Instructions")}
                    </>
                  )}
            </CustomizableLabel>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={uiText("components_imgdesc_shaper_modal.input.e_g_swap_panel_1_and_3_enhance_dramatic_ligh.placeholder", "e.g. Swap panel 1 and 3, enhance dramatic lighting, zoom on character")}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-fuchsia-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end gap-2.5">
          <CustomizableButton
            buttonId="imgdesc_shaper_modal_btn_3"
            onClick={onClose}
className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_shaper_modal.button.cancel", "Cancel")}
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="imgdesc_shaper_modal_btn_2"
            defaultIcon={<Check className="w-3.5 h-3.5 text-green-400" />}
            onClick={() => {
              if (shaperCanvasRef.current) {
                onKeepImage(shaperCanvasRef.current.toDataURL("image/png"));
                onClose();
              }
            }}
className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_shaper_modal.button.keep_layout_render", " Keep Layout Render")}
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="imgdesc_shaper_modal_btn_1"
            onClick={async () => {
              setIsApplying(true);
              try {
                await onApplyShapedImage(instructions);
                onClose();
              } finally {
                setIsApplying(false);
              }
            }}
disabled={isApplying}
className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-fuchsia-900/30"
          >
              {() => (
                  <>
                    {isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  {uiText("components_imgdesc_shaper_modal.button.regenerate_shaped_comic", "Regenerate Shaped Comic")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
