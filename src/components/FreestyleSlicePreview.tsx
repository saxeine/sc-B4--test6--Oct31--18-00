import React, { useEffect, useRef, forwardRef } from "react";
import { Eye, Maximize2, Crop, Layers } from "lucide-react";
import { type FreestyleSquare } from "./CropMeshOverlay";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";

interface FreestyleSlicePreviewProps {
  imageSrc: string;
  square: FreestyleSquare | null;
  index: number;
  naturalWidth: number;
  naturalHeight: number;
  onSelect?: () => void;
  className?: string;
  showBoundingLines?: boolean;
}

export const FreestyleSlicePreview = forwardRef<HTMLDivElement, FreestyleSlicePreviewProps>(
  function FreestyleSlicePreview(
    {
      imageSrc,
      square,
      index,
      naturalWidth,
      naturalHeight,
      className,
      showBoundingLines = true,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const pxX = square ? Math.round((square.x / 100) * naturalWidth) : 0;
    const pxY = square ? Math.round((square.y / 100) * naturalHeight) : 0;
    const pxW = square ? Math.max(1, Math.round((square.width / 100) * naturalWidth)) : 0;
    const pxH = square ? Math.max(1, Math.round((square.height / 100) * naturalHeight)) : 0;

    useEffect(() => {
      if (!square || !imageSrc || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let isCancelled = false;
      const img = new Image();
      if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }

      img.onload = () => {
        if (isCancelled) return;
        const naturalW = img.naturalWidth || naturalWidth || 800;
        const naturalH = img.naturalHeight || naturalHeight || 600;

        const curPxX = Math.round((square.x / 100) * naturalW);
        const curPxY = Math.round((square.y / 100) * naturalH);
        const curPxW = Math.max(1, Math.round((square.width / 100) * naturalW));
        const curPxH = Math.max(1, Math.round((square.height / 100) * naturalH));

        // Choose display canvas size preserving aspect ratio, max 160px
        const maxDim = 160;
        const aspect = curPxW / curPxH;
        let targetW = maxDim;
        let targetH = maxDim;
        if (aspect >= 1) {
          targetH = Math.max(1, Math.round(maxDim / aspect));
        } else {
          targetW = Math.max(1, Math.round(maxDim * aspect));
        }

        canvas.width = targetW;
        canvas.height = targetH;

        ctx.clearRect(0, 0, targetW, targetH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        try {
          ctx.save();
          if (square.points && square.points.length >= 3) {
            // Polygon clipping for Angled Slices & Trapeze Slices
            ctx.beginPath();
            square.points.forEach((pt, ptIdx) => {
              const ptPxX = ((pt.x / 100) * naturalW - curPxX) * (targetW / curPxW);
              const ptPxY = ((pt.y / 100) * naturalH - curPxY) * (targetH / curPxH);
              if (ptIdx === 0) {
                ctx.moveTo(ptPxX, ptPxY);
              } else {
                ctx.lineTo(ptPxX, ptPxY);
              }
            });
            ctx.closePath();
            ctx.clip();
          }

          ctx.drawImage(
            img,
            curPxX,
            curPxY,
            curPxW,
            curPxH,
            0,
            0,
            targetW,
            targetH
          );
          ctx.restore();

          // If showing bounding lines for trapeze/polygon, draw outer bounding rectangle and polygon outline
          if (showBoundingLines && square.points && square.points.length >= 3) {
            ctx.save();
            // Draw polygon perimeter
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            square.points.forEach((pt, ptIdx) => {
              const ptPxX = ((pt.x / 100) * naturalW - curPxX) * (targetW / curPxW);
              const ptPxY = ((pt.y / 100) * naturalH - curPxY) * (targetH / curPxH);
              if (ptIdx === 0) {
                ctx.moveTo(ptPxX, ptPxY);
              } else {
                ctx.lineTo(ptPxX, ptPxY);
              }
            });
            ctx.closePath();
            ctx.stroke();

            // Draw bounding lines (cyan dashed rectangle)
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 2]);
            ctx.strokeRect(0.5, 0.5, targetW - 1, targetH - 1);
            ctx.restore();
          }
        } catch (err) {
          console.warn("Failed to render slice preview canvas:", err);
        }
      };

      img.src = imageSrc;

      return () => {
        isCancelled = true;
      };
    }, [imageSrc, square?.x, square?.y, square?.width, square?.height, square?.id, square?.points, naturalWidth, naturalHeight, showBoundingLines]);

    if (!square) {
      return (
        <div
          ref={ref}
          className={cn(
            "bg-slate-950/80 p-2.5 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center text-center gap-1 min-h-[70px]",
            className
          )}
        >
          <Eye className="w-4 h-4 text-slate-500 opacity-60" />
          <span className="text-[10px] text-slate-400 font-medium">
            {uiText("components_freestyle_slice_preview.span.select_any_slice_to_preview", "Select any slice to preview")}
          </span>
          <span className="text-[9px] text-slate-500">
            {uiText("components_freestyle_slice_preview.span.click_any_square_on_canvas_or_list", "Click any square on canvas or list")}
          </span>
        </div>
      );
    }

    const shapeTag = square.shapeType === "polygon" ? "Angled Polygon" : square.shapeType === "trapezoid" ? "Trapeze" : "Rect Box";

    return (
      <div
        ref={ref}
        className={cn(
          "bg-slate-950/90 p-2 rounded-lg border border-cyan-500/40 space-y-1.5 shadow-sm scroll-mt-2",
          className
        )}
      >
        {/* Header Info */}
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold text-cyan-300 truncate">
              #{index + 1}: {square.label || `Square ${index + 1}`}
            </span>
            <span className="text-[8.5px] px-1 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded font-mono">
              {shapeTag}
            </span>
          </div>
          <span className="font-mono text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[9.5px] shrink-0">
            {pxW} × {pxH}{uiText("components_freestyle_slice_preview.span.px", " px")}
          </span>
        </div>

        {/* Live Preview Canvas Frame with Checkered Alpha Backdrop */}
        <div
          className="flex items-center justify-center bg-slate-900/90 rounded border border-slate-800 p-1 min-h-[85px] max-h-[120px] overflow-hidden relative group"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDcwZTE2IiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDcwZTE2IiAvPgo8L3N2Zz4=\")",
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-h-[105px] max-w-full rounded shadow-sm object-contain border border-slate-700/60"
          />
        </div>

        {/* Coordinate & Bounding Lines Footnote */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5 border-t border-slate-800/80">
          <span>{uiText("components_freestyle_slice_preview.span.x", "X: ")}{pxX}{uiText("components_freestyle_slice_preview.span.px_y", "px, Y: ")}{pxY}{uiText("components_freestyle_slice_preview.span.px_2", "px")}</span>
          <span className="text-cyan-400 flex items-center gap-1">
            {square.points ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>{uiText("components_freestyle_slice_preview.span.bounds", "Bounds (")}{square.width.toFixed(1)}% × {square.height.toFixed(1)}%)</span>
              </>
            ) : (
              `(${square.x.toFixed(1)}%, ${square.y.toFixed(1)}%)`
            )}
          </span>
        </div>
      </div>
    );
  }
);

