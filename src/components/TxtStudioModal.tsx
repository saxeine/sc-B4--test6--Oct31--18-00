// UTF-8: ✓ txtStudio Advanced Typography, Text Warping & 3D Extrusion Engine
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  Type,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Layers,
  Palette,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  ArrowRight,
  Send,
  Move,
  Grid,
  Sun,
  Shield,
  Box,
  Wand2,
} from "lucide-react";
import { saveAs } from "file-saver";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export type WarpStyle = "none" | "arc" | "arch" | "wave" | "bulge" | "flag";

export interface TextWarpConfig {
  style: WarpStyle;
  bend: number; // -100 to 100
  horizontalDistortion?: number; // -50 to 50
  verticalDistortion?: number; // -50 to 50
}

export interface GradientStop {
  offset: number;
  color: string;
}

export interface TextLayerItem {
  id: string;
  name: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: "center" | "left" | "right";
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  fillType: "solid" | "linear_gradient" | "radial_gradient";
  fillColor: string;
  gradientAngle: number;
  gradientStops: GradientStop[];
  strokeColor: string;
  strokeWidth: number;
  rotation: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  glowEnabled: boolean;
  glowColor: string;
  glowBlur: number;
  extrusionDepth: number; // 0 to 40
  extrusionColor: string;
  extrusionShadowColor: string;
  extrusionAngle: number; // degrees (e.g. 135 for bottom-right)
  warp: TextWarpConfig;
  bgBoxEnabled: boolean;
  bgBoxColor: string;
  bgBoxBorderColor: string;
  bgBoxBorderWidth: number;
  bgBoxPaddingX: number;
  bgBoxPaddingY: number;
  bgBoxRadius: number;
  bgBoxOpacity: number;
}

export interface TxtStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImageUrl?: string | null;
  activeSliceIndex?: number;
  storyboardSlotsCount?: number;
  onBakeToActiveSlice?: (dataUrl: string, sliceIndex?: number) => void;
  onSaveNewFrameToStoryboard?: (newSlice: { name: string; url: string }) => void;
}

const AVAILABLE_FONTS = [
  { name: "Orbitron", category: "Sci-Fi / Modern" },
  { name: "Space Grotesk", category: "Tech / Clean" },
  { name: "Bangers", category: "Comic / Retro" },
  { name: "Cinzel", category: "Serif / Cinematic" },
  { name: "Permanent Marker", category: "Street / Grunge" },
  { name: "Montserrat", category: "Bold Modern" },
  { name: "Fredoka", category: "Playful / Bubble" },
  { name: "Playfair Display", category: "Editorial / Luxury" },
  { name: "Plus Jakarta Sans", category: "Corporate / Clean" },
  { name: "Pacifico", category: "Script / Casual" },
  { name: "Bungee", category: "Heavy Poster" },
  { name: "Caveat", category: "Handwritten" },
];

const PRESET_STYLES: { name: "Cyber 3D" | "Synthwave" | "Comic Pop" | "Gold Foil" | "Wave Runner" | "Neon Arc" | "Bulge Poster" | "Clean Pill"; layer: Partial<TextLayerItem> }[] = [
  {
    name: "Cyber 3D",
    layer: {
      text: "CYBER CITY",
      fontFamily: "Orbitron",
      fontSize: 68,
      fontWeight: 900,
      letterSpacing: 4,
      fillType: "linear_gradient",
      fillColor: "#00f0ff",
      gradientAngle: 45,
      gradientStops: [
        { offset: 0, color: "#00f0ff" },
        { offset: 0.5, color: "#a855f7" },
        { offset: 1, color: "#ff007f" },
      ],
      strokeColor: "#ffffff",
      strokeWidth: 2,
      extrusionDepth: 18,
      extrusionColor: "#0f172a",
      extrusionShadowColor: "rgba(0,0,0,0.8)",
      extrusionAngle: 135,
      shadowColor: "#ff007f",
      shadowBlur: 20,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      glowEnabled: true,
      glowColor: "#00f0ff",
      glowBlur: 25,
      warp: { style: "arc", bend: 35, horizontalDistortion: 0, verticalDistortion: 0 },
    },
  },
  {
    name: "Synthwave",
    layer: {
      text: "RETRO RUNNER",
      fontFamily: "Bangers",
      fontSize: 74,
      fontWeight: 400,
      letterSpacing: 3,
      fillType: "linear_gradient",
      fillColor: "#ff007f",
      gradientAngle: 90,
      gradientStops: [
        { offset: 0, color: "#ff007f" },
        { offset: 0.5, color: "#ff7700" },
        { offset: 1, color: "#ffe600" },
      ],
      strokeColor: "#1e1b4b",
      strokeWidth: 4,
      extrusionDepth: 16,
      extrusionColor: "#311042",
      extrusionShadowColor: "rgba(0,0,0,0.9)",
      extrusionAngle: 120,
      shadowColor: "#ff007f",
      shadowBlur: 16,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      glowEnabled: false,
      glowColor: "#ff007f",
      glowBlur: 10,
      warp: { style: "wave", bend: 45, horizontalDistortion: 0, verticalDistortion: 0 },
    },
  },
  {
    name: "Comic Pop",
    layer: {
      text: "KA-POW!!",
      fontFamily: "Permanent Marker",
      fontSize: 80,
      fontWeight: 400,
      letterSpacing: 2,
      fillType: "solid",
      fillColor: "#facc15",
      strokeColor: "#000000",
      strokeWidth: 6,
      extrusionDepth: 22,
      extrusionColor: "#000000",
      extrusionShadowColor: "rgba(0,0,0,0.8)",
      extrusionAngle: 135,
      shadowColor: "#ef4444",
      shadowBlur: 0,
      shadowOffsetX: 8,
      shadowOffsetY: 8,
      glowEnabled: false,
      glowColor: "#facc15",
      glowBlur: 0,
      warp: { style: "arch", bend: 55, horizontalDistortion: 0, verticalDistortion: 0 },
    },
  },
  {
    name: "Gold Foil",
    layer: {
      text: "IMPERIAL",
      fontFamily: "Cinzel",
      fontSize: 64,
      fontWeight: 800,
      letterSpacing: 8,
      fillType: "linear_gradient",
      fillColor: "#fbbf24",
      gradientAngle: 45,
      gradientStops: [
        { offset: 0, color: "#fef08a" },
        { offset: 0.35, color: "#f59e0b" },
        { offset: 0.7, color: "#b45309" },
        { offset: 1, color: "#fef08a" },
      ],
      strokeColor: "#451a03",
      strokeWidth: 2,
      extrusionDepth: 14,
      extrusionColor: "#291500",
      extrusionShadowColor: "rgba(0,0,0,0.85)",
      extrusionAngle: 135,
      shadowColor: "#000000",
      shadowBlur: 20,
      shadowOffsetX: 4,
      shadowOffsetY: 6,
      glowEnabled: true,
      glowColor: "#f59e0b",
      glowBlur: 20,
      warp: { style: "arc", bend: 20, horizontalDistortion: 0, verticalDistortion: 0 },
    },
  },
  {
    name: "Wave Runner",
    layer: {
      text: "SURF VELOCITY",
      fontFamily: "Space Grotesk",
      fontSize: 60,
      fontWeight: 700,
      letterSpacing: 3,
      fillType: "solid",
      fillColor: "#06b6d4",
      strokeColor: "#083344",
      strokeWidth: 3,
      extrusionDepth: 12,
      extrusionColor: "#082f49",
      extrusionShadowColor: "rgba(0,0,0,0.7)",
      extrusionAngle: 110,
      shadowColor: "#06b6d4",
      shadowBlur: 14,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      glowEnabled: true,
      glowColor: "#22d3ee",
      glowBlur: 16,
      warp: { style: "wave", bend: -40, horizontalDistortion: 0, verticalDistortion: 0 },
    },
  },
  {
    name: "Neon Arc",
    layer: {
      text: "NIGHT DRIVE",
      fontFamily: "Orbitron",
      fontSize: 58,
      fontWeight: 900,
      letterSpacing: 5,
      fillType: "solid",
      fillColor: "#ffffff",
      strokeColor: "#ec4899",
      strokeWidth: 3,
      extrusionDepth: 6,
      extrusionColor: "#831843",
      extrusionShadowColor: "rgba(0,0,0,0.9)",
      extrusionAngle: 135,
      shadowColor: "#ec4899",
      shadowBlur: 30,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      glowEnabled: true,
      glowColor: "#f43f5e",
      glowBlur: 35,
      warp: { style: "arc", bend: -35, horizontalDistortion: 0, verticalDistortion: 0 },
    },
  },
  {
    name: "Bulge Poster",
    layer: {
      text: "EXPANSION",
      fontFamily: "Fredoka",
      fontSize: 70,
      fontWeight: 700,
      letterSpacing: 2,
      fillType: "solid",
      fillColor: "#10b981",
      strokeColor: "#022c22",
      strokeWidth: 4,
      extrusionDepth: 15,
      extrusionColor: "#064e3b",
      extrusionShadowColor: "rgba(0,0,0,0.8)",
      extrusionAngle: 135,
      shadowColor: "#10b981",
      shadowBlur: 12,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
      glowEnabled: false,
      glowColor: "#10b981",
      glowBlur: 0,
      warp: { style: "bulge", bend: 65, horizontalDistortion: 0, verticalDistortion: 0 },
    },
  },
  {
    name: "Clean Pill",
    layer: {
      text: "CHAPTER ONE",
      fontFamily: "Plus Jakarta Sans",
      fontSize: 38,
      fontWeight: 800,
      letterSpacing: 4,
      textTransform: "uppercase",
      fillType: "solid",
      fillColor: "#ffffff",
      strokeColor: "transparent",
      strokeWidth: 0,
      extrusionDepth: 0,
      extrusionColor: "#000000",
      extrusionShadowColor: "transparent",
      extrusionAngle: 135,
      shadowColor: "rgba(0,0,0,0.5)",
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      glowEnabled: false,
      glowColor: "#ffffff",
      glowBlur: 0,
      warp: { style: "none", bend: 0, horizontalDistortion: 0, verticalDistortion: 0 },
      bgBoxEnabled: true,
      bgBoxColor: "#0284c7",
      bgBoxBorderColor: "#38bdf8",
      bgBoxBorderWidth: 2,
      bgBoxPaddingX: 28,
      bgBoxPaddingY: 10,
      bgBoxRadius: 24,
      bgBoxOpacity: 0.95,
    },
  },
];

export const TxtStudioModal: React.FC<TxtStudioModalProps> = ({
  isOpen,
  onClose,
  baseImageUrl,
  activeSliceIndex,
  storyboardSlotsCount,
  onBakeToActiveSlice,
  onSaveNewFrameToStoryboard,
}) => {
  // Canvas configuration
  const [canvasWidth, setCanvasWidth] = useState<number>(1080);
  const [canvasHeight, setCanvasHeight] = useState<number>(720);
  const [stageBgMode, setStageBgMode] = useState<"dark" | "transparent" | "base_image">("dark");
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Layer State
  const [layer, setLayer] = useState<TextLayerItem>({
    id: "txt_layer_1",
    name: "Main Title",
    text: "TXT STUDIO 3D",
    x: 540,
    y: 360,
    fontSize: 72,
    fontFamily: "Orbitron",
    fontWeight: 900,
    letterSpacing: 4,
    lineHeight: 1.1,
    textAlign: "center",
    textTransform: "uppercase",
    fillType: "linear_gradient",
    fillColor: "#00f0ff",
    gradientAngle: 45,
    gradientStops: [
      { offset: 0, color: "#00f0ff" },
      { offset: 0.5, color: "#a855f7" },
      { offset: 1, color: "#ff007f" },
    ],
    strokeColor: "#ffffff",
    strokeWidth: 2.5,
    rotation: 0,
    shadowColor: "#ff007f",
    shadowBlur: 20,
    shadowOffsetX: 4,
    shadowOffsetY: 4,
    glowEnabled: true,
    glowColor: "#00f0ff",
    glowBlur: 30,
    extrusionDepth: 16,
    extrusionColor: "#0f172a",
    extrusionShadowColor: "rgba(0,0,0,0.85)",
    extrusionAngle: 135,
    warp: {
      style: "arc",
      bend: 35,
      horizontalDistortion: 0,
      verticalDistortion: 0,
    },
    bgBoxEnabled: false,
    bgBoxColor: "#0f172a",
    bgBoxBorderColor: "#00f0ff",
    bgBoxBorderWidth: 1.5,
    bgBoxPaddingX: 24,
    bgBoxPaddingY: 12,
    bgBoxRadius: 16,
    bgBoxOpacity: 0.85,
  });

  const [activeTab, setActiveTab] = useState<"text" | "warp" | "3d" | "style" | "presets">("warp");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);

  // Load Base Image if provided
  useEffect(() => {
    if (baseImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        baseImgRef.current = img;
        if (img.naturalWidth && img.naturalHeight) {
          setCanvasWidth(img.naturalWidth);
          setCanvasHeight(img.naturalHeight);
          setLayer((prev) => ({
            ...prev,
            x: Math.round(img.naturalWidth / 2),
            y: Math.round(img.naturalHeight / 2),
          }));
        }
        setStageBgMode("base_image");
      };
      img.src = baseImageUrl;
    }
  }, [baseImageUrl]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // HIGH-FIDELITY WARPING & 3D RENDERING ALGORITHMS
  // Based strictly on /docs/txtStudio.txt Technical Spec
  // ----------------------------------------------------

  const renderWarpedGlyphs = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      warp: TextWarpConfig,
      fontSize: number,
      isExtrusion = false,
      extrusionFill = "#000000"
    ) => {
      const totalWidth = ctx.measureText(text).width;
      if (totalWidth === 0 || !text) return;

      const { style, bend } = warp;

      if (style === "none" || Math.abs(bend) < 0.001) {
        // Standard straight text centered at (0, 0)
        if (isExtrusion) {
          ctx.fillStyle = extrusionFill;
          ctx.fillText(text, -totalWidth / 2, 0);
        } else {
          ctx.fillText(text, -totalWidth / 2, 0);
          if (layer.strokeWidth > 0 && layer.strokeColor !== "transparent") {
            ctx.strokeText(text, -totalWidth / 2, 0);
          }
        }
        return;
      }

      if (style === "arc") {
        // Section 4 Arc Math: curvature angle theta = (bend / 100) * PI
        const bendAngle = (bend / 100) * Math.PI;
        const radius = totalWidth / bendAngle;
        let currentX = 0;

        ctx.save();
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const charWidth = ctx.measureText(char).width;
          const charCenterX = currentX + charWidth / 2 - totalWidth / 2;
          const alpha = charCenterX / radius;

          const charX = radius * Math.sin(alpha);
          const charY = -radius * (1 - Math.cos(alpha));

          ctx.save();
          ctx.translate(charX, charY);
          ctx.rotate(alpha);

          if (isExtrusion) {
            ctx.fillStyle = extrusionFill;
            ctx.fillText(char, -charWidth / 2, 0);
          } else {
            ctx.fillText(char, -charWidth / 2, 0);
            if (layer.strokeWidth > 0 && layer.strokeColor !== "transparent") {
              ctx.strokeText(char, -charWidth / 2, 0);
            }
          }
          ctx.restore();
          currentX += charWidth;
        }
        ctx.restore();
        return;
      }

      if (style === "arch") {
        // Arch curvature: parabolic lift
        let currentX = 0;
        ctx.save();
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const charWidth = ctx.measureText(char).width;
          const charCenterX = currentX + charWidth / 2 - totalWidth / 2;
          const normalizedX = (2 * charCenterX) / totalWidth; // -1 to 1
          const lift = -(1 - normalizedX * normalizedX) * (bend * 0.8);

          ctx.save();
          ctx.translate(charCenterX, lift);
          // Angle proportional to slope
          const slopeAngle = normalizedX * (bend / 100) * 0.5;
          ctx.rotate(slopeAngle);

          if (isExtrusion) {
            ctx.fillStyle = extrusionFill;
            ctx.fillText(char, -charWidth / 2, 0);
          } else {
            ctx.fillText(char, -charWidth / 2, 0);
            if (layer.strokeWidth > 0 && layer.strokeColor !== "transparent") {
              ctx.strokeText(char, -charWidth / 2, 0);
            }
          }
          ctx.restore();
          currentX += charWidth;
        }
        ctx.restore();
        return;
      }

      if (style === "wave") {
        // Section 5 Wave: Y_wave(x) = sin((x / W) * 2*PI) * (bend * 0.35)
        let currentX = 0;
        ctx.save();
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const charWidth = ctx.measureText(char).width;
          const charCenterX = currentX + charWidth / 2 - totalWidth / 2;
          const progress = (charCenterX + totalWidth / 2) / totalWidth; // 0 to 1
          const waveY = Math.sin(progress * Math.PI * 2) * (bend * 0.45);
          const waveAngle = Math.cos(progress * Math.PI * 2) * (bend / 100) * 0.4;

          ctx.save();
          ctx.translate(charCenterX, waveY);
          ctx.rotate(waveAngle);

          if (isExtrusion) {
            ctx.fillStyle = extrusionFill;
            ctx.fillText(char, -charWidth / 2, 0);
          } else {
            ctx.fillText(char, -charWidth / 2, 0);
            if (layer.strokeWidth > 0 && layer.strokeColor !== "transparent") {
              ctx.strokeText(char, -charWidth / 2, 0);
            }
          }
          ctx.restore();
          currentX += charWidth;
        }
        ctx.restore();
        return;
      }

      if (style === "bulge") {
        // Section 5 Bulge: S_bulge(x) = 1 + (1 - (2x/W)^2) * (bend / 100)
        let currentX = 0;
        ctx.save();
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const charWidth = ctx.measureText(char).width;
          const charCenterX = currentX + charWidth / 2 - totalWidth / 2;
          const normalizedX = (2 * charCenterX) / totalWidth; // -1 to 1
          const scaleY = Math.max(0.2, 1 + (1 - normalizedX * normalizedX) * (bend / 100));

          ctx.save();
          ctx.translate(charCenterX, 0);
          ctx.scale(1, scaleY);

          if (isExtrusion) {
            ctx.fillStyle = extrusionFill;
            ctx.fillText(char, -charWidth / 2, 0);
          } else {
            ctx.fillText(char, -charWidth / 2, 0);
            if (layer.strokeWidth > 0 && layer.strokeColor !== "transparent") {
              ctx.strokeText(char, -charWidth / 2, 0);
            }
          }
          ctx.restore();
          currentX += charWidth;
        }
        ctx.restore();
        return;
      }

      if (style === "flag") {
        // Flag: Wave with increasing amplitude from left to right
        let currentX = 0;
        ctx.save();
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const charWidth = ctx.measureText(char).width;
          const charCenterX = currentX + charWidth / 2 - totalWidth / 2;
          const progress = (charCenterX + totalWidth / 2) / totalWidth; // 0 to 1
          const amplitude = progress * (bend * 0.6);
          const flagY = Math.sin(progress * Math.PI * 2.5) * amplitude;
          const flagAngle = Math.cos(progress * Math.PI * 2.5) * (bend / 100) * progress * 0.5;

          ctx.save();
          ctx.translate(charCenterX, flagY);
          ctx.rotate(flagAngle);

          if (isExtrusion) {
            ctx.fillStyle = extrusionFill;
            ctx.fillText(char, -charWidth / 2, 0);
          } else {
            ctx.fillText(char, -charWidth / 2, 0);
            if (layer.strokeWidth > 0 && layer.strokeColor !== "transparent") {
              ctx.strokeText(char, -charWidth / 2, 0);
            }
          }
          ctx.restore();
          currentX += charWidth;
        }
        ctx.restore();
      }
    },
    [layer.strokeColor, layer.strokeWidth]
  );

  // Main Canvas Render Loop
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Render Background
    if (stageBgMode === "dark") {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      // Subtle background grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.05)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvasWidth; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvasHeight; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
    } else if (stageBgMode === "base_image" && baseImgRef.current) {
      ctx.drawImage(baseImgRef.current, 0, 0, canvasWidth, canvasHeight);
    } else {
      // Checkerboard for transparent
      const size = 20;
      for (let x = 0; x < canvasWidth; x += size) {
        for (let y = 0; y < canvasHeight; y += size) {
          ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#0f172a" : "#1e293b";
          ctx.fillRect(x, y, size, size);
        }
      }
    }

    // 2. Setup Font & Measure
    let displayText = layer.text;
    if (layer.textTransform === "uppercase") displayText = displayText.toUpperCase();
    if (layer.textTransform === "lowercase") displayText = displayText.toLowerCase();
    if (layer.textTransform === "capitalize") {
      displayText = displayText.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    const fontStyleStr = `${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}", sans-serif`;
    ctx.font = fontStyleStr;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const measuredWidth = ctx.measureText(displayText).width;

    // 3. Render Background Box (if enabled)
    if (layer.bgBoxEnabled) {
      ctx.save();
      ctx.globalAlpha = layer.bgBoxOpacity;
      ctx.fillStyle = layer.bgBoxColor;
      ctx.strokeStyle = layer.bgBoxBorderColor;
      ctx.lineWidth = layer.bgBoxBorderWidth;

      const boxW = measuredWidth + layer.bgBoxPaddingX * 2;
      const boxH = layer.fontSize * layer.lineHeight + layer.bgBoxPaddingY * 2;
      const boxX = -boxW / 2;
      const boxY = -boxH / 2;
      const r = layer.bgBoxRadius;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, r);
      ctx.fill();
      if (layer.bgBoxBorderWidth > 0) {
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Section 6: 3D Extrusion Layer Stacking Algorithm
    const depth = layer.extrusionDepth || 0;
    if (depth > 0) {
      ctx.save();
      const extAngleRad = (layer.extrusionAngle * Math.PI) / 180;
      const dirX = Math.cos(extAngleRad);
      const dirY = Math.sin(extAngleRad);

      for (let d = depth; d >= 1; d--) {
        const offX = d * 1.5 * dirX;
        const offY = d * 1.5 * dirY;

        ctx.save();
        ctx.translate(offX, offY);

        // Color shading gradient between shadow color and extrusion color
        const ratio = d / depth;
        ctx.fillStyle = ratio > 0.6 ? layer.extrusionShadowColor : layer.extrusionColor;

        renderWarpedGlyphs(
          ctx,
          displayText,
          layer.warp,
          layer.fontSize,
          true,
          ctx.fillStyle as string
        );
        ctx.restore();
      }
      ctx.restore();
    }

    // 5. Outer Glow Effect (rendered prior to main glyphs)
    if (layer.glowEnabled && layer.glowBlur > 0) {
      ctx.save();
      ctx.shadowColor = layer.glowColor;
      ctx.shadowBlur = layer.glowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = layer.glowColor;
      renderWarpedGlyphs(ctx, displayText, layer.warp, layer.fontSize, true, layer.glowColor);
      ctx.restore();
    }

    // 6. Main Shadow & Fill/Stroke Setup
    ctx.save();
    if (layer.shadowBlur > 0 || layer.shadowOffsetX !== 0 || layer.shadowOffsetY !== 0) {
      ctx.shadowColor = layer.shadowColor;
      ctx.shadowBlur = layer.shadowBlur;
      ctx.shadowOffsetX = layer.shadowOffsetX;
      ctx.shadowOffsetY = layer.shadowOffsetY;
    }

    // Prepare Fill Style
    if (layer.fillType === "solid") {
      ctx.fillStyle = layer.fillColor;
    } else if (layer.fillType === "linear_gradient") {
      const gradAngleRad = (layer.gradientAngle * Math.PI) / 180;
      const halfW = measuredWidth / 2;
      const gX0 = -halfW * Math.cos(gradAngleRad);
      const gY0 = -halfW * Math.sin(gradAngleRad);
      const gX1 = halfW * Math.cos(gradAngleRad);
      const gY1 = halfW * Math.sin(gradAngleRad);

      const grad = ctx.createLinearGradient(gX0, gY0, gX1, gY1);
      layer.gradientStops.forEach((stop) => grad.addColorStop(stop.offset, stop.color));
      ctx.fillStyle = grad;
    } else if (layer.fillType === "radial_gradient") {
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, measuredWidth / 1.5);
      layer.gradientStops.forEach((stop) => grad.addColorStop(stop.offset, stop.color));
      ctx.fillStyle = grad;
    }

    // Prepare Stroke Style
    ctx.strokeStyle = layer.strokeColor;
    ctx.lineWidth = layer.strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // 7. Render Front Main Text Layer (Warped or Standard)
    renderWarpedGlyphs(ctx, displayText, layer.warp, layer.fontSize, false);

    ctx.restore(); // Main text save
    ctx.restore(); // Matrix translate save
  }, [canvasWidth, canvasHeight, stageBgMode, layer, renderWarpedGlyphs]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Dragging Layer on Canvas
  const [isDraggingText, setIsDraggingText] = useState(false);
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; layerX: number; layerY: number }>({
    mouseX: 0,
    mouseY: 0,
    layerX: 0,
    layerY: 0,
  });

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setIsDraggingText(true);
    dragStartPos.current = {
      mouseX,
      mouseY,
      layerX: layer.x,
      layerY: layer.y,
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingText) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const dx = mouseX - dragStartPos.current.mouseX;
    const dy = mouseY - dragStartPos.current.mouseY;

    setLayer((prev) => ({
      ...prev,
      x: Math.round(dragStartPos.current.layerX + dx),
      y: Math.round(dragStartPos.current.layerY + dy),
    }));
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingText(false);
  };

  // Export & Baking Actions
  const getBakedCanvasDataUrl = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  };

  const handleBakeToStoryboard = () => {
    const dataUrl = getBakedCanvasDataUrl();
    if (!dataUrl) return;
    if (onBakeToActiveSlice) {
      onBakeToActiveSlice(dataUrl, activeSliceIndex ?? 0);
      showToast(`Baked to Storyboard frame #${(activeSliceIndex ?? 0) + 1}!`);
    } else {
      showToast("Storyboard frame baked!");
    }
  };

  const handleAddNewFrame = () => {
    const dataUrl = getBakedCanvasDataUrl();
    if (!dataUrl) return;
    if (onSaveNewFrameToStoryboard) {
      onSaveNewFrameToStoryboard({
        name: `txtStudio_${layer.text.slice(0, 12).trim() || "title"}`,
        url: dataUrl,
      });
      showToast("Appended new frame to Storyboard!");
    }
  };

  const handleDownloadPng = () => {
    const dataUrl = getBakedCanvasDataUrl();
    if (!dataUrl) return;
    saveAs(dataUrl, `txtstudio_${Date.now()}.png`);
    showToast("Downloaded transparent high-res PNG!");
  };

  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("Copied image to clipboard!");
      });
    } catch {
      showToast("Clipboard copy not supported in this browser.");
    }
  };

  const applyPreset = (preset: typeof PRESET_STYLES[number]) => {
    setLayer((prev) => ({
      ...prev,
      ...preset.layer,
      warp: { ...prev.warp, ...(preset.layer.warp || {}) },
    }));
    showToast(`Applied "${preset.name}" preset!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 select-none">
      <div className="flex flex-col w-full max-w-6xl h-[92vh] bg-[#0a0f1d] border border-cyan-500/50 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-cyan-500/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-400">
              <Type className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="txt_studio_modal_item_29"
                  as="h2"
                  className="text-sm font-black tracking-wider uppercase text-cyan-300"
                >
                    {() => (
                        <>
                          {uiText("components_txt_studio_modal.h2.txtstudio", "txtStudio")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {uiText("components_txt_studio_modal.span.warp_and_3d_typography_engine", "Warp & 3D Typography Engine")}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400">
                {uiText("components_txt_studio_modal.p.non_linear_path_text_warping_arc_wave_bulge", "Non-linear path text warping (arc, wave, bulge), 3D vector extrusion & high-res baking")}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="txt_studio_modal_btn_28"
              defaultIcon={<Copy className="w-3.5 h-3.5 text-cyan-400" />}
              type="button"
onClick={handleCopyToClipboard}
className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
title={uiText("components_txt_studio_modal.button.copy_baked_canvas_to_clipboard.title", "Copy baked canvas to clipboard")}
            >
                {() => (
                    <>
                      <span>{uiText("components_txt_studio_modal.span.copy", "Copy")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="txt_studio_modal_btn_27"
              defaultIcon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
              type="button"
onClick={handleDownloadPng}
className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
title={uiText("components_txt_studio_modal.button.download_full_resolution_transparent_png.title", "Download full resolution transparent PNG")}
            >
                {() => (
                    <>
                      <span>{uiText("components_txt_studio_modal.span.png", "PNG")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="txt_studio_modal_btn_26"
              defaultIcon={<Check className="w-3.5 h-3.5 stroke-[3]" />}
              type="button"
onClick={handleBakeToStoryboard}
className="px-3 py-1 text-[11px] font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all font-black"
title={uiText("components_txt_studio_modal.button.bake_directly_to_active_storyboard_frame.title", "Bake directly to active Storyboard frame")}
            >
                {() => (
                    <>
                      <span>{uiText("components_txt_studio_modal.span.bake_frame", "Bake Frame")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="txt_studio_modal_btn_25"
              defaultIcon={<X className="w-4 h-4" />}
              type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors ml-1 cursor-pointer"
title={uiText("components_txt_studio_modal.button.close_txtstudio.title", "Close txtStudio")}
            />
          </div>
        </div>

        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="bg-cyan-950/90 border-b border-cyan-500/50 px-4 py-1.5 text-xs font-bold text-cyan-200 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <CustomizableButton
              buttonId="txt_studio_modal_btn_24"
              defaultIcon={<X className="w-3 h-3" />}
              type="button"
onClick={() => setToastMessage(null)}
className="text-cyan-400 hover:text-white"
            />
          </div>
        )}

        {/* Studio Body: Left Inspector & Right Live Canvas Stage */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Inspector Sidebar */}
          <div className="w-84 sm:w-96 border-r border-slate-800 bg-[#080d19] flex flex-col shrink-0 overflow-hidden">
            {/* Inspector Navigation Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/80 p-1 gap-1 shrink-0 overflow-x-auto scrollbar-none">
              {(
                [
                  { id: "warp", label: "Warp FX", icon: Wand2 },
                  { id: "3d", label: "3D Extrude", icon: Box },
                  { id: "text", label: "Typography", icon: Type },
                  { id: "style", label: "Color & Box", icon: Palette },
                  { id: "presets", label: "Presets", icon: Sparkles },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <CustomizableButton
                    buttonId="txt_studio_modal_btn_23"
                    key={tab.id}
type="button"
onClick={() => setActiveTab(tab.id)}
className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap border ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900"
                    }`}
                  >
                      {() => (
                          <>
                            <Icon className="w-3 h-3" />
                          <span>{tab.label}</span>
                          </>
                        )}
                  </CustomizableButton>
                );
              })}
            </div>

            {/* Inspector Tab Content Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin text-xs">
              {/* TAB 1: WARPING ENGINE */}
              {activeTab === "warp" && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                      <Wand2 className="w-3 h-3 text-cyan-400" />
                      {uiText("components_txt_studio_modal.span.non_linear_path_warping_style", "Non-Linear Path Warping Style")}
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: "none", label: "Straight" },
                          { id: "arc", label: "Circular Arc" },
                          { id: "arch", label: "Arch" },
                          { id: "wave", label: "Wave" },
                          { id: "bulge", label: "Bulge" },
                          { id: "flag", label: "Flag" },
                        ] as const
                      ).map((item) => (
                        <CustomizableButton
                          buttonId="txt_studio_modal_btn_22"
                          key={item.id}
type="button"
onClick={() =>
                            setLayer((prev) => ({
                              ...prev,
                              warp: {
                                ...prev.warp,
                                style: item.id,
                                bend: item.id === "none" ? 0 : prev.warp.bend || 35,
                              },
                            }))
                          }
className={`p-2 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                            layer.warp.style === item.id
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                              : "bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
                          }`}
                        >
                            {() => (
                                <>
                                  {item.label}
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>
                  </div>

                  {layer.warp.style !== "none" && (
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div>
                        <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-300 mb-1">
                          <span>{uiText("components_txt_studio_modal.span.bend_curvature", "Bend Curvature")}</span>
                          <span className="font-mono text-cyan-400">{layer.warp.bend}%</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={layer.warp.bend}
                          onChange={(e) =>
                            setLayer((prev) => ({
                              ...prev,
                              warp: { ...prev.warp, bend: parseInt(e.target.value) },
                            }))
                          }
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                        <div className="flex justify-between text-[8.5px] text-slate-500 font-mono mt-0.5">
                          <span>{uiText("components_txt_studio_modal.span.100_invert", "-100 (Invert)")}</span>
                          <span>0</span>
                          <span>{uiText("components_txt_studio_modal.span.100_max", "+100 (Max)")}</span>
                        </div>
                      </div>

                      {/* Quick Bend Presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[9px] text-slate-400 font-semibold">{uiText("components_txt_studio_modal.span.quick", "Quick:")}</span>
                        {[-50, -25, 25, 50, 75].map((val) => (
                          <CustomizableButton
                            buttonId="txt_studio_modal_btn_21"
                            key={val}
type="button"
onClick={() =>
                              setLayer((prev) => ({
                                ...prev,
                                warp: { ...prev.warp, bend: val },
                              }))
                            }
className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-cyan-950 text-[9px] font-mono text-cyan-300 border border-slate-800 cursor-pointer"
                          >
                              {() => (
                                  <>
                                    {val > 0 ? `+${val}` : val}
                                  </>
                                )}
                          </CustomizableButton>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Positioning & Rotation */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {uiText("components_txt_studio_modal.span.position_and_rotation", "Position & Rotation")}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <CustomizableLabel
                          labelId="txt_studio_modal_item_20"
                          as="label"
                          className="text-[10px] text-slate-400 font-medium"
                        >
                            {() => (
                                <>
                                  {uiText("components_txt_studio_modal.label.position_x", "Position X")}
                                </>
                              )}
                        </CustomizableLabel>
                        <input
                          type="number"
                          value={layer.x}
                          onChange={(e) =>
                            setLayer((prev) => ({ ...prev, x: parseInt(e.target.value) || 0 }))
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <CustomizableLabel
                          labelId="txt_studio_modal_item_19"
                          as="label"
                          className="text-[10px] text-slate-400 font-medium"
                        >
                            {() => (
                                <>
                                  {uiText("components_txt_studio_modal.label.position_y", "Position Y")}
                                </>
                              )}
                        </CustomizableLabel>
                        <input
                          type="number"
                          value={layer.y}
                          onChange={(e) =>
                            setLayer((prev) => ({ ...prev, y: parseInt(e.target.value) || 0 }))
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                        <span>{uiText("components_txt_studio_modal.span.rotation", "Rotation")}</span>
                        <span className="font-mono text-cyan-400">{layer.rotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={layer.rotation}
                        onChange={(e) =>
                          setLayer((prev) => ({ ...prev, rotation: parseInt(e.target.value) }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 3D EXTRUSION ENGINE */}
              {activeTab === "3d" && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                        <Box className="w-3 h-3 text-cyan-400" />
                        {uiText("components_txt_studio_modal.span.3d_extrusion_vector_depth", "3D Extrusion Vector Depth")}
                      </span>
                      <CustomizableButton
                        buttonId="txt_studio_modal_btn_18"
                        type="button"
onClick={() =>
                          setLayer((prev) => ({
                            ...prev,
                            extrusionDepth: prev.extrusionDepth > 0 ? 0 : 16,
                          }))
                        }
className={`text-[9.5px] px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          layer.extrusionDepth > 0
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-950 text-slate-500 border-slate-800"
                        }`}
                      >
                          {() => (
                              <>
                                {layer.extrusionDepth > 0 ? "Enabled" : "Disabled"}
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-300 mb-1">
                        <span>{uiText("components_txt_studio_modal.span.depth_pixels", "Depth Pixels")}</span>
                        <span className="font-mono text-cyan-400">{layer.extrusionDepth}{uiText("components_txt_studio_modal.span.px", "px")}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={layer.extrusionDepth}
                        onChange={(e) =>
                          setLayer((prev) => ({
                            ...prev,
                            extrusionDepth: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-300 mb-1">
                        <span>{uiText("components_txt_studio_modal.span.lighting_projection_angle", "Lighting / Projection Angle")}</span>
                        <span className="font-mono text-cyan-400">{layer.extrusionAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={layer.extrusionAngle}
                        onChange={(e) =>
                          setLayer((prev) => ({
                            ...prev,
                            extrusionAngle: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <CustomizableLabel
                          labelId="txt_studio_modal_item_17"
                          as="label"
                          className="text-[10px] text-slate-400 font-medium block mb-1"
                        >
                            {() => (
                                <>
                                  {uiText("components_txt_studio_modal.label.extrusion_color", "Extrusion Color")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
                          <input
                            type="color"
                            value={layer.extrusionColor}
                            onChange={(e) =>
                              setLayer((prev) => ({ ...prev, extrusionColor: e.target.value }))
                            }
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="font-mono text-[10px] text-slate-300">
                            {layer.extrusionColor}
                          </span>
                        </div>
                      </div>

                      <div>
                        <CustomizableLabel
                          labelId="txt_studio_modal_item_16"
                          as="label"
                          className="text-[10px] text-slate-400 font-medium block mb-1"
                        >
                            {() => (
                                <>
                                  {uiText("components_txt_studio_modal.label.shadow_accent", "Shadow Accent")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
                          <input
                            type="color"
                            value={layer.extrusionShadowColor}
                            onChange={(e) =>
                              setLayer((prev) => ({
                                ...prev,
                                extrusionShadowColor: e.target.value,
                              }))
                            }
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="font-mono text-[10px] text-slate-300 truncate">
                            {layer.extrusionShadowColor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Outer Glow Control */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1">
                        <Sun className="w-3 h-3 text-cyan-400" />
                        {uiText("components_txt_studio_modal.span.neon_outer_glow", "Neon Outer Glow")}
                      </span>
                      <CustomizableButton
                        buttonId="txt_studio_modal_btn_15"
                        type="button"
onClick={() =>
                          setLayer((prev) => ({ ...prev, glowEnabled: !prev.glowEnabled }))
                        }
className={`text-[9.5px] px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          layer.glowEnabled
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-950 text-slate-500 border-slate-800"
                        }`}
                      >
                          {() => (
                              <>
                                {layer.glowEnabled ? "Active" : "Off"}
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    {layer.glowEnabled && (
                      <div className="space-y-2 pt-1">
                        <div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                            <span>{uiText("components_txt_studio_modal.span.glow_blur", "Glow Blur")}</span>
                            <span className="font-mono text-cyan-400">{layer.glowBlur}{uiText("components_txt_studio_modal.span.px_2", "px")}</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="60"
                            value={layer.glowBlur}
                            onChange={(e) =>
                              setLayer((prev) => ({ ...prev, glowBlur: parseInt(e.target.value) }))
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{uiText("components_txt_studio_modal.span.glow_color", "Glow Color:")}</span>
                          <input
                            type="color"
                            value={layer.glowColor}
                            onChange={(e) =>
                              setLayer((prev) => ({ ...prev, glowColor: e.target.value }))
                            }
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="font-mono text-[10px] text-cyan-300">
                            {layer.glowColor}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TYPOGRAPHY SETTINGS */}
              {activeTab === "text" && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <CustomizableLabel
                      labelId="txt_studio_modal_item_14"
                      as="label"
                      className="text-[10px] font-black uppercase text-slate-400 tracking-wider"
                    >
                        {() => (
                            <>
                              {uiText("components_txt_studio_modal.label.text_content", "Text Content")}
                            </>
                          )}
                    </CustomizableLabel>
                    <textarea
                      value={layer.text}
                      onChange={(e) => setLayer((prev) => ({ ...prev, text: e.target.value }))}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 resize-none font-bold"
                      placeholder={uiText("components_txt_studio_modal.textarea.enter_title_text.placeholder", "Enter title text...")}
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <CustomizableLabel
                      labelId="txt_studio_modal_item_13"
                      as="label"
                      className="text-[10px] font-black uppercase text-slate-400 tracking-wider"
                    >
                        {() => (
                            <>
                              {uiText("components_txt_studio_modal.label.font_family", "Font Family")}
                            </>
                          )}
                    </CustomizableLabel>
                    <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto scrollbar-thin pr-1">
                      {AVAILABLE_FONTS.map((font) => (
                        <CustomizableButton
                          buttonId="txt_studio_modal_btn_12"
                          key={font.name}
type="button"
onClick={() => setLayer((prev) => ({ ...prev, fontFamily: font.name }))}
className={`p-1.5 rounded-lg text-left transition-all border cursor-pointer ${
                            layer.fontFamily === font.name
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                              : "bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
                          }`}
                        >
                            {() => (
                                <>
                                  <div
                            className="text-xs truncate"
                            style={{ fontFamily: font.name }}
                          >
                            {font.name}
                          </div>
                                <div className="text-[8px] text-slate-500 truncate">{font.category}</div>
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <div>
                      <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-300 mb-1">
                        <span>{uiText("components_txt_studio_modal.span.font_size", "Font Size")}</span>
                        <span className="font-mono text-cyan-400">{layer.fontSize}{uiText("components_txt_studio_modal.span.px_3", "px")}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="140"
                        value={layer.fontSize}
                        onChange={(e) =>
                          setLayer((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-300 mb-1">
                        <span>{uiText("components_txt_studio_modal.span.letter_spacing", "Letter Spacing")}</span>
                        <span className="font-mono text-cyan-400">{layer.letterSpacing}{uiText("components_txt_studio_modal.span.px_4", "px")}</span>
                      </div>
                      <input
                        type="range"
                        min="-2"
                        max="24"
                        value={layer.letterSpacing}
                        onChange={(e) =>
                          setLayer((prev) => ({
                            ...prev,
                            letterSpacing: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      {(["none", "uppercase", "lowercase", "capitalize"] as const).map((trans) => (
                        <CustomizableButton
                          buttonId="txt_studio_modal_btn_11"
                          key={trans}
type="button"
onClick={() => setLayer((prev) => ({ ...prev, textTransform: trans }))}
className={`flex-1 py-1 rounded text-[9.5px] font-bold capitalize border cursor-pointer transition-colors ${
                            layer.textTransform === trans
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                            {() => (
                                <>
                                  {trans === "none" ? "Normal" : trans}
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: COLOR, STROKE & BACKGROUND BOX */}
              {activeTab === "style" && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {uiText("components_txt_studio_modal.span.fill_type_and_palette", "Fill Type & Palette")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          { id: "solid", label: "Solid" },
                          { id: "linear_gradient", label: "Linear Grad" },
                          { id: "radial_gradient", label: "Radial Grad" },
                        ] as const
                      ).map((item) => (
                        <CustomizableButton
                          buttonId="txt_studio_modal_btn_10"
                          key={item.id}
type="button"
onClick={() => setLayer((prev) => ({ ...prev, fillType: item.id }))}
className={`flex-1 py-1 rounded-md text-[9.5px] font-bold border transition-colors cursor-pointer ${
                            layer.fillType === item.id
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                            {() => (
                                <>
                                  {item.label}
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>

                    {layer.fillType === "solid" ? (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">{uiText("components_txt_studio_modal.span.color", "Color:")}</span>
                        <input
                          type="color"
                          value={layer.fillColor}
                          onChange={(e) =>
                            setLayer((prev) => ({ ...prev, fillColor: e.target.value }))
                          }
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-xs text-slate-200">{layer.fillColor}</span>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-300">
                          <span>{uiText("components_txt_studio_modal.span.gradient_angle", "Gradient Angle:")}</span>
                          <span className="font-mono text-cyan-400">{layer.gradientAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={layer.gradientAngle}
                          onChange={(e) =>
                            setLayer((prev) => ({
                              ...prev,
                              gradientAngle: parseInt(e.target.value),
                            }))
                          }
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[9.5px] text-slate-400">{uiText("components_txt_studio_modal.span.stops", "Stops:")}</span>
                          {layer.gradientStops.map((stop, sIdx) => (
                            <input
                              key={sIdx}
                              type="color"
                              value={stop.color}
                              onChange={(e) => {
                                const next = [...layer.gradientStops];
                                next[sIdx] = { ...next[sIdx], color: e.target.value };
                                setLayer((prev) => ({ ...prev, gradientStops: next }));
                              }}
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stroke Outline */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {uiText("components_txt_studio_modal.span.stroke_outline", "Stroke Outline")}
                    </span>
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                        <span>{uiText("components_txt_studio_modal.span.width", "Width")}</span>
                        <span className="font-mono text-cyan-400">{layer.strokeWidth}{uiText("components_txt_studio_modal.span.px_5", "px")}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="16"
                        step="0.5"
                        value={layer.strokeWidth}
                        onChange={(e) =>
                          setLayer((prev) => ({
                            ...prev,
                            strokeWidth: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">{uiText("components_txt_studio_modal.span.stroke_color", "Stroke Color:")}</span>
                      <input
                        type="color"
                        value={layer.strokeColor}
                        onChange={(e) =>
                          setLayer((prev) => ({ ...prev, strokeColor: e.target.value }))
                        }
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-xs text-slate-200">{layer.strokeColor}</span>
                    </div>
                  </div>

                  {/* Background Container Box */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        {uiText("components_txt_studio_modal.span.background_box_pill", "Background Box / Pill")}
                      </span>
                      <CustomizableButton
                        buttonId="txt_studio_modal_btn_9"
                        type="button"
onClick={() =>
                          setLayer((prev) => ({ ...prev, bgBoxEnabled: !prev.bgBoxEnabled }))
                        }
className={`text-[9.5px] px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          layer.bgBoxEnabled
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-950 text-slate-500 border-slate-800"
                        }`}
                      >
                          {() => (
                              <>
                                {layer.bgBoxEnabled ? "Active" : "Off"}
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    {layer.bgBoxEnabled && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <CustomizableLabel
                              labelId="txt_studio_modal_item_8"
                              as="label"
                              className="text-[9.5px] text-slate-400"
                            >
                                {() => (
                                    <>
                                      {uiText("components_txt_studio_modal.label.box_color", "Box Color")}
                                    </>
                                  )}
                            </CustomizableLabel>
                            <input
                              type="color"
                              value={layer.bgBoxColor}
                              onChange={(e) =>
                                setLayer((prev) => ({ ...prev, bgBoxColor: e.target.value }))
                              }
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                            />
                          </div>
                          <div>
                            <CustomizableLabel
                              labelId="txt_studio_modal_item_7"
                              as="label"
                              className="text-[9.5px] text-slate-400"
                            >
                                {() => (
                                    <>
                                      {uiText("components_txt_studio_modal.label.border_color", "Border Color")}
                                    </>
                                  )}
                            </CustomizableLabel>
                            <input
                              type="color"
                              value={layer.bgBoxBorderColor}
                              onChange={(e) =>
                                setLayer((prev) => ({ ...prev, bgBoxBorderColor: e.target.value }))
                              }
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-300 mb-1">
                            <span>{uiText("components_txt_studio_modal.span.border_radius", "Border Radius")}</span>
                            <span className="font-mono text-cyan-400">{layer.bgBoxRadius}{uiText("components_txt_studio_modal.span.px_6", "px")}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={layer.bgBoxRadius}
                            onChange={(e) =>
                              setLayer((prev) => ({
                                ...prev,
                                bgBoxRadius: parseInt(e.target.value),
                              }))
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: PRESETS GALLERY */}
              {activeTab === "presets" && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider block">
                    {uiText("components_txt_studio_modal.span.curated_typography_presets_8", "Curated Typography Presets (8)")}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {PRESET_STYLES.map((preset) => (
                      <CustomizableButton
                        buttonId="txt_studio_modal_btn_6"
                        key={preset.name}
type="button"
onClick={() => applyPreset(preset)}
className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group flex items-center justify-between"
                      >
                          {() => (
                              <>
                                <div>
                          <div className="font-bold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {preset.name}
                          </div>
                          <div className="text-[9.5px] text-slate-500 font-mono">
                            {preset.layer.fontFamily} • {preset.layer.warp?.style || "straight"} •{" "}
                            {preset.layer.extrusionDepth ? `${preset.layer.extrusionDepth}px 3D` : "flat"}
                          </div>
                        </div>
                              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                          {uiText("components_txt_studio_modal.span.apply", "Apply")}
                        </span>
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Stage & Canvas Render Area */}
          <div
            ref={containerRef}
            className="flex-1 flex flex-col bg-[#050811] relative overflow-hidden"
          >
            {/* Stage Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">{uiText("components_txt_studio_modal.span.canvas_stage", "Canvas Stage:")}</span>
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 gap-0.5">
                  {(
                    [
                      { id: "dark", label: "Dark Grid" },
                      { id: "transparent", label: "Transparent" },
                      ...(baseImageUrl ? [{ id: "base_image", label: "Active Slice" }] : []),
                    ] as const
                  ).map((mode) => (
                    <CustomizableButton
                      buttonId="txt_studio_modal_btn_5"
                      key={mode.id}
type="button"
onClick={() => setStageBgMode(mode.id as any)}
className={`px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                        stageBgMode === mode.id
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                        {() => (
                            <>
                              {mode.label}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono">
                  {canvasWidth} × {canvasHeight}{uiText("components_txt_studio_modal.span.px_7", "px")}
                </span>
              </div>

              {/* Zoom & Reset Controls */}
              <div className="flex items-center gap-1.5">
                <CustomizableButton
                  buttonId="txt_studio_modal_btn_4"
                  defaultIcon={<ZoomOut className="w-3 h-3" />}
                  type="button"
onClick={() => setZoomScale((z) => Math.max(0.3, z - 0.1))}
className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
title={uiText("components_txt_studio_modal.button.zoom_out.title", "Zoom Out")}
                />
                <span className="text-[10px] font-mono text-cyan-400 w-10 text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <CustomizableButton
                  buttonId="txt_studio_modal_btn_3"
                  defaultIcon={<ZoomIn className="w-3 h-3" />}
                  type="button"
onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.1))}
className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
title={uiText("components_txt_studio_modal.button.zoom_in.title", "Zoom In")}
                />
                <CustomizableButton
                  buttonId="txt_studio_modal_100"
                  defaultLabel={"100%"}
                  type="button"
onClick={() => setZoomScale(1)}
className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[9px] font-mono text-slate-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: "center center",
                  transition: isDraggingText ? "none" : "transform 0.1s ease",
                }}
                className="shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-slate-800 rounded-lg overflow-hidden bg-slate-950 relative"
              >
                <canvas
                  ref={canvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="cursor-move block max-w-none"
                  title={uiText("components_txt_studio_modal.canvas.drag_text_directly_on_canvas_to_reposition.title", "Drag text directly on canvas to reposition")}
                />
              </div>

              {/* Floating Drag Hint */}
              <div className="absolute bottom-3 left-4 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2 py-1 rounded-md text-[9px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
                <Move className="w-3 h-3 text-cyan-400" />
                <span>{uiText("components_txt_studio_modal.span.drag_text_on_canvas_to_reposition", "Drag text on canvas to reposition")}</span>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {uiText("components_txt_studio_modal.span.active_style", "Active Style: ")}<strong className="text-cyan-300">{layer.warp.style}</strong>{uiText("components_txt_studio_modal.span.bend", " (bend")}{" "}
                  {layer.warp.bend}{uiText("components_txt_studio_modal.span.3d_depth", "%), 3D depth ")}<strong className="text-purple-300">{layer.extrusionDepth}{uiText("components_txt_studio_modal.strong.px", "px")}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onSaveNewFrameToStoryboard && (
                  <CustomizableButton
                    buttonId="txt_studio_modal_btn_2"
                    defaultIcon={<Plus className="w-3.5 h-3.5 text-cyan-400" />}
                    type="button"
onClick={handleAddNewFrame}
className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_txt_studio_modal.span.append_new_frame", "Append New Frame")}</span>
                          </>
                        )}
                  </CustomizableButton>
                )}
                <CustomizableButton
                  buttonId="txt_studio_modal_btn_1"
                  defaultIcon={<Send className="w-3.5 h-3.5 stroke-[3]" />}
                  type="button"
onClick={handleBakeToStoryboard}
className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                >
                    {() => (
                        <>
                          <span>{uiText("components_txt_studio_modal.span.bake_to_storyboard", "Bake to Storyboard")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
