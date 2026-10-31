import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Scissors,
  Sparkles,
  Sliders,
  Check,
  RotateCcw,
  Eye,
  Layers,
  Rocket,
  Grid,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

interface SmartContourAutoSlicerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeImageSrc?: string;
  onSendSlicesToStoryboard?: (slices: { url: string; name: string }[]) => void;
}

export interface ContourBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export const SmartContourAutoSlicerModal: React.FC<SmartContourAutoSlicerModalProps> = ({
  isOpen,
  onClose,
  activeImageSrc,
  onSendSlicesToStoryboard,
}) => {
  // Contour Slicing Controls
  const [alphaThreshold, setAlphaThreshold] = useState<number>(20);
  const [minIslandArea, setMinIslandArea] = useState<number>(400);
  const [padding, setPadding] = useState<number>(4);
  const [detectedContours, setDetectedContours] = useState<ContourBounds[]>([]);
  const [isDetecting, setIsTracing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Optical Boundary Detection Algorithm
  useEffect(() => {
    if (!isOpen || !activeImageSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeImageSrc;
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        detectSpriteContours(imgData, img.width, img.height);
      }
    };
  }, [isOpen, activeImageSrc, alphaThreshold, minIslandArea, padding]);

  if (!isOpen) return null;

  // Flood-fill Connected Component Labeling to isolate discrete sprite bounds
  const detectSpriteContours = (
    imgData: ImageData,
    width: number,
    height: number
  ) => {
    setIsTracing(true);
    const data = imgData.data;
    const visited = new Uint8Array(width * height);
    const boundsList: ContourBounds[] = [];

    const getAlpha = (x: number, y: number) => {
      return data[(y * width + x) * 4 + 3];
    };

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = y * width + x;
        if (visited[idx] === 1) continue;

        if (getAlpha(x, y) >= alphaThreshold) {
          // BFS / Flood fill to discover connected island bounds
          let minX = x,
            maxX = x,
            minY = y,
            maxY = y;
          const queue: [number, number][] = [[x, y]];
          visited[idx] = 1;
          let pixelCount = 0;

          while (queue.length > 0 && pixelCount < 10000) {
            const [currX, currY] = queue.pop()!;
            pixelCount++;

            minX = Math.min(minX, currX);
            maxX = Math.max(maxX, currX);
            minY = Math.min(minY, currY);
            maxY = Math.max(maxY, currY);

            // 4-neighbor check with step 3
            const neighbors: [number, number][] = [
              [currX + 3, currY],
              [currX - 3, currY],
              [currX, currY + 3],
              [currX, currY - 3],
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (visited[nIdx] === 0 && getAlpha(nx, ny) >= alphaThreshold) {
                  visited[nIdx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }

          const w = maxX - minX;
          const h = maxY - minY;
          const area = w * h;

          if (area >= minIslandArea) {
            boundsList.push({
              x: Math.max(0, minX - padding),
              y: Math.max(0, minY - padding),
              width: Math.min(width - minX, w + padding * 2),
              height: Math.min(height - minY, h + padding * 2),
              area,
            });
          }
        }
      }
    }

    setDetectedContours(boundsList);
    setIsTracing(false);
  };

  const handleSliceAndSend = () => {
    if (!canvasRef.current || detectedContours.length === 0) return;

    const sourceCanvas = canvasRef.current;
    const ctx = sourceCanvas.getContext("2d");
    if (!ctx) return;

    const generatedSlices = detectedContours.map((c, idx) => {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = c.width;
      sliceCanvas.height = c.height;
      const sCtx = sliceCanvas.getContext("2d");
      if (sCtx) {
        sCtx.drawImage(
          sourceCanvas,
          c.x,
          c.y,
          c.width,
          c.height,
          0,
          0,
          c.width,
          c.height
        );
      }
      return {
        url: sliceCanvas.toDataURL("image/png"),
        name: `Sprite_Contour_${idx + 1}`,
      };
    });

    if (onSendSlicesToStoryboard) {
      onSendSlicesToStoryboard(generatedSlices);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[82vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="smart_contour_auto_slicer_modal_item_4"
                as="h2"
                className="text-base font-bold text-white flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_smart_contour_auto_slicer_modal.h2.smart_contour_auto_slicer", "Smart Contour Auto-Slicer")}
                      <span className="text-[10px] uppercase font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {uiText("components_smart_contour_auto_slicer_modal.span.optical_sprite_slicer", "Optical Sprite Slicer")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">
                {uiText("components_smart_contour_auto_slicer_modal.p.optical_boundary_detection_and_auto_contour", "Optical boundary detection & auto-contour isolator for sprite sheets and complex graphics")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="smart_contour_auto_slicer_modal_btn_3"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          />
        </div>

        {/* Body Content */}
        <div className="flex-1 flex overflow-hidden p-5 gap-5">
          {/* Live Contour Preview Stage */}
          <div className="flex-1 bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute top-3 left-3 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-xl">
              {detectedContours.length}{uiText("components_smart_contour_auto_slicer_modal.div.sprites_objects_isolated", " Sprites / Objects Isolated")}
            </div>

            <div className="relative w-80 h-80 border border-slate-800 rounded-xl p-2 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] flex items-center justify-center shadow-lg overflow-hidden">
              {activeImageSrc && (
                <img src={activeImageSrc} alt={uiText("components_smart_contour_auto_slicer_modal.img.source.alt", "Source")} className="w-full h-full object-contain opacity-75" />
              )}

              {/* Bounding Box Highlights */}
              {detectedContours.map((c, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-cyan-400 bg-cyan-400/20 rounded shadow-md pointer-events-none transition-all"
                  style={{
                    left: `${(c.x / (canvasRef.current?.width || 1)) * 100}%`,
                    top: `${(c.y / (canvasRef.current?.height || 1)) * 100}%`,
                    width: `${(c.width / (canvasRef.current?.width || 1)) * 100}%`,
                    height: `${(c.height / (canvasRef.current?.height || 1)) * 100}%`,
                  }}
                >
                  <span className="absolute -top-4 left-0 text-[9px] font-bold bg-cyan-500 text-slate-950 px-1 rounded shadow">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slicer Settings Sidebar */}
          <div className="w-72 bg-slate-950/60 rounded-2xl border border-slate-800 p-4 flex flex-col gap-4">
            <CustomizableLabel
              labelId="smart_contour_auto_slicer_modal_item_2"
              defaultIcon={<Sliders className="w-3.5 h-3.5 text-cyan-400" />}
              as="h3"
              className="text-xs font-bold text-slate-200 flex items-center gap-2"
            >
                {() => (
                    <>
                      {uiText("components_smart_contour_auto_slicer_modal.h3.contour_parameters", "Contour Parameters")}
                    </>
                  )}
            </CustomizableLabel>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{uiText("components_smart_contour_auto_slicer_modal.span.alpha_threshold", "Alpha Threshold:")}</span>
                  <span className="text-cyan-300 font-mono">{alphaThreshold}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={alphaThreshold}
                  onChange={(e) => setAlphaThreshold(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{uiText("components_smart_contour_auto_slicer_modal.span.min_object_size", "Min Object Size:")}</span>
                  <span className="text-cyan-300 font-mono">{minIslandArea}{uiText("components_smart_contour_auto_slicer_modal.span.px", "px")}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={minIslandArea}
                  onChange={(e) => setMinIslandArea(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{uiText("components_smart_contour_auto_slicer_modal.span.margin_padding", "Margin Padding:")}</span>
                  <span className="text-cyan-300 font-mono">+{padding}{uiText("components_smart_contour_auto_slicer_modal.span.px_2", "px")}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={padding}
                  onChange={(e) => setPadding(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <CustomizableButton
                buttonId="smart_contour_auto_slicer_modal_btn_1"
                defaultIcon={<Rocket className="w-4 h-4" />}
                onClick={handleSliceAndSend}
className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
              >
                  {() => (
                      <>
                        {uiText("components_smart_contour_auto_slicer_modal.button.slice_and_send_all", "Slice & Send All ")}
                      {detectedContours.length}
                      {uiText("components_smart_contour_auto_slicer_modal.button.to_storyboard", " to Storyboard")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
