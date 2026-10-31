import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Palette,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Layers,
  Wand2,
  RefreshCw,
  Eye,
  Zap,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

interface TraceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeImageSrc?: string;
  onApplyColorPalette?: (swatches: string[]) => void;
}

export interface ColorSwatch {
  hex: string;
  count: number;
  percentage: number;
}

export const TraceStudioModal: React.FC<TraceStudioModalProps> = ({
  isOpen,
  onClose,
  activeImageSrc,
  onApplyColorPalette,
}) => {
  const [activeTab, setActiveTab] = useState<"trace" | "palette">("trace");

  // Auto-Trace Settings
  const [threshold, setThreshold] = useState<number>(128);
  const [simplification, setSimplification] = useState<number>(2);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [svgOutput, setSvgOutput] = useState<string>("");
  const [pathCount, setPathCount] = useState<number>(0);

  // Palette Extraction Settings
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [paletteCount, setPaletteCount] = useState<number>(6);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Analyze active image and extract swatches & trace paths
  useEffect(() => {
    if (!isOpen || !activeImageSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeImageSrc;
    img.onload = () => {
      // Draw image on hidden canvas
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = Math.min(400, img.width);
      canvas.height = Math.min(400, img.height);
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Extract Dominant Palette
        extractPalette(imgData.data, paletteCount);

        // Generate Initial Vector Trace
        generateAutoTrace(imgData, canvas.width, canvas.height, threshold, simplification);
      }
    };
  }, [isOpen, activeImageSrc, paletteCount, threshold, simplification]);

  if (!isOpen) return null;

  // Dominant Color Extractor via K-Means / Bucket Quantization
  const extractPalette = (data: Uint8ClampedArray, colorCount: number) => {
    const colorMap: Record<string, number> = {};
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 16) {
      // Sample every 4th pixel for speed
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 50) continue; // Skip transparent

      // Quantize to 16-step grid
      const qR = Math.round(r / 16) * 16;
      const qG = Math.round(g / 16) * 16;
      const qB = Math.round(b / 16) * 16;

      const hex = `#${((1 << 24) + (qR << 16) + (qG << 8) + qB).toString(16).slice(1)}`;
      colorMap[hex] = (colorMap[hex] || 0) + 1;
      totalPixels++;
    }

    const sorted = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount)
      .map(([hex, count]) => ({
        hex,
        count,
        percentage: Math.round((count / Math.max(1, totalPixels)) * 100),
      }));

    setSwatches(sorted);
  };

  // Raster to Vector Auto Trace Algorithm
  const generateAutoTrace = (
    imgData: ImageData,
    width: number,
    height: number,
    thresh: number,
    step: number
  ) => {
    setIsTracing(true);
    const data = imgData.data;
    const paths: string[] = [];

    // Simple contour edge detection
    for (let y = 0; y < height; y += step * 2) {
      let pathD = "";
      let inPath = false;

      for (let x = 0; x < width; x += step * 2) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const isDark = luma < thresh && a > 50;

        if (isDark) {
          if (!inPath) {
            pathD += `M ${x} ${y} `;
            inPath = true;
          } else {
            pathD += `L ${x} ${y} `;
          }
        } else {
          if (inPath) {
            pathD += "Z ";
            inPath = false;
          }
        }
      }
      if (inPath) pathD += "Z ";
      if (pathD.trim().length > 0) {
        paths.push(pathD);
      }
    }

    const compiledSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <g fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
    ${paths.map((p) => `<path d="${p}" />`).join("\n    ")}
  </g>
</svg>`;

    setSvgOutput(compiledSvg);
    setPathCount(paths.length);
    setIsTracing(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const downloadSvg = () => {
    const blob = new Blob([svgOutput], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vector_trace_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[82vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="trace_studio_modal_item_11"
                as="h2"
                className="text-base font-bold text-white flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_trace_studio_modal.h2.trace_and_color_swatch_studio", "Trace & Color Swatch Studio")}
                      <span className="text-[10px] uppercase font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  {uiText("components_trace_studio_modal.span.vector_and_palette_engine", "Vector & Palette Engine")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">
                {uiText("components_trace_studio_modal.p.raster_to_vector_svg_tracing_and_dominant_co", "Raster-to-Vector SVG tracing & dominant color palette scheme extraction")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="trace_studio_modal_btn_10"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          />
        </div>

        {/* Studio Sub-Tabs Header */}
        <div className="px-5 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-3 shrink-0 text-xs font-bold">
          <CustomizableButton
            buttonId="trace_studio_modal_btn_9"
            defaultIcon={<Wand2 className="w-4 h-4" />}
            onClick={() => setActiveTab("trace")}
className={cn(
              "px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer",
              activeTab === "trace"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            )}
          >
              {() => (
                  <>
                    {uiText("components_trace_studio_modal.button.raster_to_vector_trace", "Raster-to-Vector Trace")}
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="trace_studio_modal_btn_8"
            defaultLabel={")"}
            defaultIcon={<Palette className="w-4 h-4" />}
            onClick={() => setActiveTab("palette")}
className={cn(
              "px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer",
              activeTab === "palette"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            )}
          >
              {(ibcProps) => (
                  <>
                    {uiText("components_trace_studio_modal.button.dominant_palette_extractor", "Dominant Palette Extractor (")}
                  {swatches.length}
                  {!ibcProps.isTextHidden ? ibcProps.label : null}
                  </>
                )}
          </CustomizableButton>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden p-5 gap-5">
          {activeTab === "trace" ? (
            /* Vector Auto-Trace Mode */
            <div className="flex-1 flex gap-5 overflow-hidden">
              {/* SVG Vector Preview Stage */}
              <div className="flex-1 bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="absolute top-3 left-3 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                  {pathCount}{uiText("components_trace_studio_modal.div.svg_vector_contours_traced", " SVG Vector Contours Traced")}
                </div>

                <div
                  className="w-72 h-72 border border-slate-800 rounded-xl p-2 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] flex items-center justify-center shadow-lg"
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              </div>

              {/* Vector Parameters Sidebar */}
              <div className="w-72 bg-slate-950/60 rounded-2xl border border-slate-800 p-4 flex flex-col gap-4">
                <CustomizableLabel
                  labelId="trace_studio_modal_item_7"
                  defaultIcon={<Sliders className="w-3.5 h-3.5 text-purple-400" />}
                  as="h3"
                  className="text-xs font-bold text-slate-200 flex items-center gap-2"
                >
                    {() => (
                        <>
                          {uiText("components_trace_studio_modal.h3.tracing_tolerances", "Tracing Tolerances")}
                        </>
                      )}
                </CustomizableLabel>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{uiText("components_trace_studio_modal.span.luma_threshold", "Luma Threshold:")}</span>
                      <span className="text-purple-300 font-mono">{threshold}</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="220"
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value))}
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{uiText("components_trace_studio_modal.span.sampling_precision", "Sampling Precision:")}</span>
                      <span className="text-purple-300 font-mono">{simplification}{uiText("components_trace_studio_modal.span.px", "px")}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={simplification}
                      onChange={(e) => setSimplification(parseInt(e.target.value))}
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <CustomizableButton
                    buttonId="trace_studio_modal_btn_6"
                    defaultIcon={<Download className="w-4 h-4" />}
                    onClick={downloadSvg}
className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
                  >
                      {() => (
                          <>
                            {uiText("components_trace_studio_modal.button.download_clean_svg_file", "Download Clean .SVG File")}
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="trace_studio_modal_btn_5"
                    onClick={() => copyToClipboard(svgOutput, "svg")}
className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                      {() => (
                          <>
                            {isCopied === "svg" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {isCopied === "svg" ? "SVG Copied!" : "Copy SVG Markup"}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            </div>
          ) : (
            /* Color Swatch & Palette Extractor Mode */
            <div className="flex-1 flex gap-5 overflow-hidden">
              {/* Palette Grid Display */}
              <div className="flex-1 bg-slate-950/80 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <CustomizableLabel
                    labelId="trace_studio_modal_item_4"
                    defaultLabel={")"}
                    defaultIcon={<Palette className="w-4 h-4 text-purple-400" />}
                    as="h3"
                    className="text-xs font-bold text-slate-300 flex items-center gap-2"
                  >
                      {(ibcProps) => (
                          <>
                            {uiText("components_trace_studio_modal.h3.extracted_dominant_swatches", "Extracted Dominant Swatches (")}
                          {swatches.length}
                          {!ibcProps.isTextHidden ? ibcProps.label : null}
                          </>
                        )}
                  </CustomizableLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{uiText("components_trace_studio_modal.span.swatches", "Swatches:")}</span>
                    {[4, 6, 8, 12].map((num) => (
                      <CustomizableButton
                        buttonId="trace_studio_modal_btn_3"
                        key={num}
onClick={() => setPaletteCount(num)}
className={cn(
                          "px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-colors",
                          paletteCount === num
                            ? "bg-purple-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                          {() => (
                              <>
                                {num}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {swatches.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3 shadow hover:border-slate-700 transition-all group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg shadow-inner border border-white/20 shrink-0"
                        style={{ backgroundColor: s.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold font-mono text-white flex items-center justify-between">
                          <span>{s.hex.toUpperCase()}</span>
                          <span className="text-[10px] text-slate-400">{s.percentage}%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{uiText("components_trace_studio_modal.p.swatch", "Swatch #")}{idx + 1}</p>
                      </div>
                      <CustomizableButton
                        buttonId="trace_studio_modal_btn_2"
                        onClick={() => copyToClipboard(s.hex, s.hex)}
className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-400 hover:text-white transition-colors"
title={uiText("components_trace_studio_modal.button.copy_hex_color.title", "Copy Hex Color")}
                      >
                          {() => (
                              <>
                                {isCopied === s.hex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  ))}
                </div>

                {onApplyColorPalette && (
                  <div className="mt-auto pt-4 border-t border-slate-800">
                    <CustomizableButton
                      buttonId="trace_studio_modal_btn_1"
                      defaultIcon={<Sparkles className="w-4 h-4" />}
                      onClick={() => {
                        onApplyColorPalette(swatches.map((s) => s.hex));
                        onClose();
                      }}
className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
                    >
                        {() => (
                            <>
                              {uiText("components_trace_studio_modal.button.apply_swatches_to_active_workspace", "Apply Swatches to Active Workspace")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
