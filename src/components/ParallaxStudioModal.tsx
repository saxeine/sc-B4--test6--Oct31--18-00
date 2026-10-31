import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Layers,
  Sparkles,
  Sliders,
  Move,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Download,
  Check,
  Maximize2,
  Box,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

interface ParallaxStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeImageSrc?: string;
}

export const ParallaxStudioModal: React.FC<ParallaxStudioModalProps> = ({
  isOpen,
  onClose,
  activeImageSrc,
}) => {
  // Parallax Tilt States
  const [tiltX, setTiltX] = useState<number>(0);
  const [tiltY, setTiltY] = useState<number>(0);
  const [depthAmount, setDepthAmount] = useState<number>(25);
  const [isAutoOrbit, setIsAutoOrbit] = useState<boolean>(true);
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1);

  // Depth Layers Configuration
  const [foregroundScale, setForegroundScale] = useState<number>(1.08);
  const [midgroundScale, setMidgroundScale] = useState<number>(1.04);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Auto-Orbit Parallax Camera Movement Loop
  useEffect(() => {
    if (!isOpen || !isAutoOrbit) return;

    let angle = 0;
    const animate = () => {
      angle += 0.03 * orbitSpeed;
      setTiltX(Math.sin(angle) * depthAmount);
      setTiltY(Math.cos(angle * 0.7) * (depthAmount * 0.8));
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isAutoOrbit, orbitSpeed, depthAmount]);

  if (!isOpen) return null;

  // Interactive Mouse Tilt Simulation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAutoOrbit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltX(x * depthAmount * 2);
    setTiltY(y * depthAmount * 2);
  };

  const sampleImage = activeImageSrc || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="parallax_studio_modal_item_6"
                as="h2"
                className="text-base font-bold text-white flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_parallax_studio_modal.h2.2_5d_depth_and_parallax_studio", "2.5D Depth & Parallax Studio")}
                      <span className="text-[10px] uppercase font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {uiText("components_parallax_studio_modal.span.parallax_camera", "Parallax Camera")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">
                {uiText("components_parallax_studio_modal.p.split_single_panels_into_foreground_midgroun", "Split single panels into foreground, midground & background 2.5D depth layers")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="parallax_studio_modal_btn_5"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* 3D Parallax Viewport Stage */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="flex-1 bg-slate-950/90 border-r border-slate-800/80 flex items-center justify-center p-8 relative overflow-hidden select-none"
          >
            <div className="absolute top-4 left-4 text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Move className="w-3.5 h-3.5" />
              {uiText("components_parallax_studio_modal.div.tilt_x", "Tilt X: ")}{Math.round(tiltX)}{uiText("components_parallax_studio_modal.div.px_y", "px | Y: ")}{Math.round(tiltY)}{uiText("components_parallax_studio_modal.div.px", "px")}
            </div>

            {/* Parallax Stage Container */}
            <div className="relative w-80 h-80 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden bg-slate-900 flex items-center justify-center [perspective:1000px]">
              {/* Background Layer */}
              <div
                className="absolute inset-0 transition-transform duration-75 ease-out filter brightness-75 blur-[1px]"
                style={{
                  transform: `translate3d(${-tiltX * 0.3}px, ${-tiltY * 0.3}px, -50px) scale(1.15)`,
                }}
              >
                <img src={sampleImage} alt={uiText("components_parallax_studio_modal.img.background.alt", "Background")} className="w-full h-full object-cover" />
              </div>

              {/* Midground Layer */}
              <div
                className="absolute inset-0 transition-transform duration-75 ease-out"
                style={{
                  transform: `translate3d(${tiltX * 0.4}px, ${tiltY * 0.4}px, 0px) scale(${midgroundScale})`,
                }}
              >
                <img src={sampleImage} alt={uiText("components_parallax_studio_modal.img.midground.alt", "Midground")} className="w-full h-full object-cover filter contrast-105" />
              </div>

              {/* Foreground Layer */}
              <div
                className="absolute inset-0 transition-transform duration-75 ease-out filter drop-shadow-2xl"
                style={{
                  transform: `translate3d(${tiltX * 0.8}px, ${tiltY * 0.8}px, 50px) scale(${foregroundScale})`,
                }}
              >
                <img src={sampleImage} alt={uiText("components_parallax_studio_modal.img.foreground.alt", "Foreground")} className="w-full h-full object-contain filter saturate-120" />
              </div>

              {/* Wireframe Outline Overlay */}
              {showWireframe && (
                <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 pointer-events-none rounded-2xl" />
              )}
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="w-80 bg-slate-900/90 border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
            {/* Camera Orbit Controls */}
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-3">
              <CustomizableLabel
                labelId="parallax_studio_modal_item_4"
                defaultIcon={<Box className="w-3.5 h-3.5 text-amber-400" />}
                as="h3"
                className="text-xs font-bold text-slate-300 flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_parallax_studio_modal.h3.2_5d_parallax_camera", "2.5D Parallax Camera")}
                      </>
                    )}
              </CustomizableLabel>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{uiText("components_parallax_studio_modal.span.auto_camera_orbit", "Auto Camera Orbit:")}</span>
                <CustomizableButton
                  buttonId="parallax_studio_modal_btn_3"
                  onClick={() => setIsAutoOrbit(!isAutoOrbit)}
className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5",
                    isAutoOrbit
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "bg-slate-800 text-slate-400"
                  )}
                >
                    {() => (
                        <>
                          {isAutoOrbit ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isAutoOrbit ? "Orbit ON" : "Mouse Tilt"}
                        </>
                      )}
                </CustomizableButton>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{uiText("components_parallax_studio_modal.span.depth_movement_intensity", "Depth Movement Intensity:")}</span>
                  <span className="text-amber-300 font-mono">{depthAmount}{uiText("components_parallax_studio_modal.span.px", "px")}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={depthAmount}
                  onChange={(e) => setDepthAmount(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Depth Layer Offsets */}
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-3">
              <CustomizableLabel
                labelId="parallax_studio_modal_item_2"
                defaultIcon={<Layers className="w-3.5 h-3.5 text-amber-400" />}
                as="h3"
                className="text-xs font-bold text-slate-300 flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_parallax_studio_modal.h3.layer_depth_scales", "Layer Depth Scales")}
                      </>
                    )}
              </CustomizableLabel>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{uiText("components_parallax_studio_modal.span.foreground_scale", "Foreground Scale:")}</span>
                  <span className="text-amber-300 font-mono">{foregroundScale.toFixed(2)}{uiText("components_parallax_studio_modal.span.x", "x")}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.3"
                  step="0.01"
                  value={foregroundScale}
                  onChange={(e) => setForegroundScale(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{uiText("components_parallax_studio_modal.span.midground_scale", "Midground Scale:")}</span>
                  <span className="text-amber-300 font-mono">{midgroundScale.toFixed(2)}{uiText("components_parallax_studio_modal.span.x_2", "x")}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.2"
                  step="0.01"
                  value={midgroundScale}
                  onChange={(e) => setMidgroundScale(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Export Actions */}
            <div className="mt-auto space-y-2">
              <CustomizableButton
                buttonId="parallax_studio_modal_btn_1"
                defaultIcon={<Check className="w-4 h-4" />}
                onClick={onClose}
className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
              >
                  {() => (
                      <>
                        {uiText("components_parallax_studio_modal.button.apply_2_5d_parallax_effect", "Apply 2.5D Parallax Effect")}
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
