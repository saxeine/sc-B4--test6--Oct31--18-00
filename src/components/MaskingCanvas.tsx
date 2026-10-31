import React, { useRef, useEffect, useState } from "react";
import { Eraser, Paintbrush, RotateCcw } from "lucide-react";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableButton } from "./CustomizableButton";

interface MaskingCanvasProps {
  imageSrc: string;
  onMaskChange: (maskDataUrl: string | null) => void;
  brushSize: number;
}

export const MaskingCanvas: React.FC<MaskingCanvasProps> = ({
  imageSrc,
  onMaskChange,
  brushSize = 20,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 600;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [imageSrc]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onMaskChange(canvas.toDataURL("image/png"));
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize * scaleX;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.7)"; // Red semi-transparent inpaint mask
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onMaskChange(null);
  };

  return (
    <div className="relative flex flex-col gap-2">
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden bg-black/60 aspect-square flex items-center justify-center">
        <img
          src={imageSrc}
          alt={uiText("components_masking_canvas.img.underlying_layer.alt", "Underlying layer")}
          className="max-w-full max-h-full object-contain pointer-events-none select-none"
        />
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onMouseMove={draw}
          className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
        />
      </div>

      <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <CustomizableButton
            buttonId="masking_canvas_btn_3"
            defaultIcon={<Paintbrush className="w-3 h-3" />}
            type="button"
onClick={() => setIsEraser(false)}
className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition ${
              !isEraser ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
            }`}
          >
              {() => (
                  <>
                    {uiText("components_masking_canvas.button.brush", " Brush")}
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="masking_canvas_btn_2"
            defaultIcon={<Eraser className="w-3 h-3" />}
            type="button"
onClick={() => setIsEraser(true)}
className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition ${
              isEraser ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
            }`}
          >
              {() => (
                  <>
                    {uiText("components_masking_canvas.button.eraser", " Eraser")}
                  </>
                )}
          </CustomizableButton>
        </div>

        <CustomizableButton
          buttonId="masking_canvas_btn_1"
          defaultIcon={<RotateCcw className="w-3 h-3" />}
          type="button"
onClick={handleClear}
className="px-2 py-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded flex items-center gap-1 cursor-pointer"
        >
            {() => (
                <>
                  {uiText("components_masking_canvas.button.reset_mask", " Reset Mask")}
                </>
              )}
        </CustomizableButton>
      </div>
    </div>
  );
};
