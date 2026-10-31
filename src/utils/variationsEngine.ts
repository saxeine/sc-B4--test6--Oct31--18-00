// UTF-8: Variations Generator Engine for SeqCarver Studio
export type DistributionMode = "loop" | "linear" | "oscillate" | "random";

export interface EffectConfigZoom {
  enabled: boolean;
  mode: "zoom_in" | "zoom_out" | "pulse";
  strength: number; // 0 to 100% (e.g. 1.0 to 1.5x)
  pivot: "center" | "top" | "bottom" | "left" | "right";
}

export interface EffectConfigColor {
  enabled: boolean;
  mode: "hue_shift" | "saturation_cycle" | "warm_cool" | "duotone" | "vintage";
  hueDelta: number; // -180 to +180
  saturationDelta: number; // -100 to +100
  temperature: number; // -100 (cool) to +100 (warm)
}

export interface EffectConfigSpatialMotion {
  enabled: boolean;
  mode: "handheld_shake" | "lateral_pan" | "vertical_bob" | "diagonal_kinetic" | "micro_tilt";
  distance: number; // 0 to 50 px
  tiltAngle: number; // 0 to 8 degrees
  smoothness: "smooth_sine" | "chaotic_jitter" | "bounce";
}

export interface EffectConfigDistortion {
  enabled: boolean;
  mode: "wave_ripple" | "pinch_bulge" | "swirl_twist" | "horizontal_glitch";
  intensity: number; // 0 to 100
  frequency: number; // 1 to 10
}

export interface EffectConfigBlur {
  enabled: boolean;
  mode: "motion_blur" | "radial_blur" | "lens_bokeh";
  strength: number; // 0 to 30 px
  angle: number; // 0 to 360 deg
}

export interface EffectConfigGrain {
  enabled: boolean;
  intensity: number; // 0 to 100%
  size: "fine" | "medium" | "coarse";
  colored: boolean;
}

export interface EffectConfigRgbSplit {
  enabled: boolean;
  offset: number; // 0 to 30 px
  angle: number; // 0 to 360 deg
}

export interface EffectConfigVignette {
  enabled: boolean;
  intensity: number; // 0 to 100%
  radius: number; // 30 to 100%
}

export interface EffectConfigLightLeak {
  enabled: boolean;
  theme: "warm_amber" | "cool_cyan" | "magenta_neon" | "golden_hour";
  intensity: number; // 0 to 100%
  position: "top_left" | "top_right" | "bottom_left" | "bottom_right";
}

export interface EffectConfigPosterize {
  enabled: boolean;
  steps: number; // 3 to 16
  edgeGlow: number; // 0 to 100%
}

export interface EffectConfigExposureStrobe {
  enabled: boolean;
  brightnessDelta: number; // -50 to +50%
  contrastDelta: number; // -50 to +50%
}

export interface VariationsStudioConfig {
  frameCount: number; // default 6 (ranges from 2 to 32)
  distributionMode: DistributionMode;
  autoOverscan: boolean; // slightly zoom base to prevent empty edges during spatial movement
  
  // 11 Modular Effects:
  zoom: EffectConfigZoom;
  color: EffectConfigColor;
  spatialMotion: EffectConfigSpatialMotion;
  distortion: EffectConfigDistortion;
  blur: EffectConfigBlur;
  grain: EffectConfigGrain;
  rgbSplit: EffectConfigRgbSplit;
  vignette: EffectConfigVignette;
  lightLeak: EffectConfigLightLeak;
  posterize: EffectConfigPosterize;
  exposureStrobe: EffectConfigExposureStrobe;
}

export const DEFAULT_VARIATIONS_CONFIG: VariationsStudioConfig = {
  frameCount: 6,
  distributionMode: "loop",
  autoOverscan: true,
  
  zoom: {
    enabled: true,
    mode: "pulse",
    strength: 18, // 18% zoom
    pivot: "center",
  },
  color: {
    enabled: false,
    mode: "warm_cool",
    hueDelta: 25,
    saturationDelta: 20,
    temperature: 30,
  },
  spatialMotion: {
    enabled: true,
    mode: "lateral_pan",
    distance: 16, // 16px lateral movement
    tiltAngle: 2, // 2 deg tilt
    smoothness: "smooth_sine",
  },
  distortion: {
    enabled: false,
    mode: "wave_ripple",
    intensity: 25,
    frequency: 3,
  },
  blur: {
    enabled: true,
    mode: "motion_blur",
    strength: 10,
    angle: 0,
  },
  grain: {
    enabled: false,
    intensity: 25,
    size: "medium",
    colored: false,
  },
  rgbSplit: {
    enabled: false,
    offset: 8,
    angle: 0,
  },
  vignette: {
    enabled: false,
    intensity: 40,
    radius: 70,
  },
  lightLeak: {
    enabled: false,
    theme: "warm_amber",
    intensity: 45,
    position: "top_right",
  },
  posterize: {
    enabled: false,
    steps: 6,
    edgeGlow: 30,
  },
  exposureStrobe: {
    enabled: false,
    brightnessDelta: 20,
    contrastDelta: 15,
  },
};

export interface VariationsPreset {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  config: Partial<VariationsStudioConfig>;
}

export const VARIATIONS_PRESETS: VariationsPreset[] = [
  {
    id: "kinetic_motion",
    name: "Kinetic Motion Illusion",
    subtitle: "Pan, subtle zoom pulse & directional speed blur",
    badge: "Motion",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    config: {
      frameCount: 8,
      distributionMode: "loop",
      autoOverscan: true,
      spatialMotion: {
        enabled: true,
        mode: "lateral_pan",
        distance: 22,
        tiltAngle: 2.5,
        smoothness: "smooth_sine",
      },
      zoom: {
        enabled: true,
        mode: "pulse",
        strength: 12,
        pivot: "center",
      },
      blur: {
        enabled: true,
        mode: "motion_blur",
        strength: 14,
        angle: 0,
      },
      distortion: { enabled: false, mode: "wave_ripple", intensity: 20, frequency: 3 },
      color: { enabled: false, mode: "hue_shift", hueDelta: 15, saturationDelta: 10, temperature: 0 },
      grain: { enabled: false, intensity: 15, size: "fine", colored: false },
      rgbSplit: { enabled: false, offset: 5, angle: 0 },
    },
  },
  {
    id: "handheld_camera",
    name: "Handheld Camera Breathing",
    subtitle: "Organic micro-shake jitter, subtle bob & 35mm grain",
    badge: "Cinema",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    config: {
      frameCount: 10,
      distributionMode: "random",
      autoOverscan: true,
      spatialMotion: {
        enabled: true,
        mode: "handheld_shake",
        distance: 12,
        tiltAngle: 1.5,
        smoothness: "chaotic_jitter",
      },
      zoom: {
        enabled: true,
        mode: "pulse",
        strength: 8,
        pivot: "center",
      },
      grain: {
        enabled: true,
        intensity: 30,
        size: "fine",
        colored: false,
      },
      vignette: {
        enabled: true,
        intensity: 35,
        radius: 75,
      },
      blur: { enabled: false, mode: "motion_blur", strength: 4, angle: 0 },
      rgbSplit: { enabled: false, offset: 4, angle: 0 },
    },
  },
  {
    id: "action_impact",
    name: "Action Crash Zoom",
    subtitle: "Explosive zoom impact, radial blur & shutter flash",
    badge: "Impact",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    config: {
      frameCount: 6,
      distributionMode: "linear",
      autoOverscan: true,
      zoom: {
        enabled: true,
        mode: "zoom_in",
        strength: 40,
        pivot: "center",
      },
      blur: {
        enabled: true,
        mode: "radial_blur",
        strength: 22,
        angle: 0,
      },
      exposureStrobe: {
        enabled: true,
        brightnessDelta: 35,
        contrastDelta: 25,
      },
      spatialMotion: {
        enabled: true,
        mode: "diagonal_kinetic",
        distance: 14,
        tiltAngle: 3,
        smoothness: "bounce",
      },
      rgbSplit: {
        enabled: true,
        offset: 12,
        angle: 45,
      },
    },
  },
  {
    id: "psychedelic_warp",
    name: "Psychedelic Wave Flow",
    subtitle: "Undulating wave ripples, RGB prism & hue shift",
    badge: "Trippy",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    config: {
      frameCount: 8,
      distributionMode: "loop",
      autoOverscan: true,
      distortion: {
        enabled: true,
        mode: "wave_ripple",
        intensity: 45,
        frequency: 4,
      },
      color: {
        enabled: true,
        mode: "hue_shift",
        hueDelta: 90,
        saturationDelta: 35,
        temperature: 0,
      },
      rgbSplit: {
        enabled: true,
        offset: 16,
        angle: 90,
      },
      zoom: {
        enabled: true,
        mode: "pulse",
        strength: 15,
        pivot: "center",
      },
    },
  },
  {
    id: "cyberpunk_glitch",
    name: "Cyberpunk Glitch Drift",
    subtitle: "Horizontal glitch shift, RGB chromatic split & neon leak",
    badge: "Sci-Fi",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    config: {
      frameCount: 8,
      distributionMode: "random",
      autoOverscan: true,
      distortion: {
        enabled: true,
        mode: "horizontal_glitch",
        intensity: 50,
        frequency: 6,
      },
      rgbSplit: {
        enabled: true,
        offset: 18,
        angle: 0,
      },
      lightLeak: {
        enabled: true,
        theme: "cool_cyan",
        intensity: 60,
        position: "top_right",
      },
      color: {
        enabled: true,
        mode: "duotone",
        hueDelta: 60,
        saturationDelta: 40,
        temperature: -40,
      },
      posterize: {
        enabled: true,
        steps: 7,
        edgeGlow: 35,
      },
    },
  },
  {
    id: "dreamy_film",
    name: "Dreamy Golden Flare",
    subtitle: "Warm light leak, gentle floating bob & soft lens glow",
    badge: "Retro",
    badgeColor: "bg-amber-400/20 text-amber-200 border-amber-400/30",
    config: {
      frameCount: 6,
      distributionMode: "loop",
      autoOverscan: true,
      lightLeak: {
        enabled: true,
        theme: "golden_hour",
        intensity: 65,
        position: "top_left",
      },
      spatialMotion: {
        enabled: true,
        mode: "vertical_bob",
        distance: 14,
        tiltAngle: 1.2,
        smoothness: "smooth_sine",
      },
      zoom: {
        enabled: true,
        mode: "pulse",
        strength: 10,
        pivot: "center",
      },
      blur: {
        enabled: true,
        mode: "lens_bokeh",
        strength: 6,
        angle: 0,
      },
      grain: {
        enabled: true,
        intensity: 22,
        size: "fine",
        colored: false,
      },
      vignette: {
        enabled: true,
        intensity: 45,
        radius: 70,
      },
    },
  },
];

export interface GeneratedVariationFrame {
  id: string;
  frameIndex: number;
  name: string;
  url: string;
  progress: number; // 0 to 1 normalized progression
  summary: string;
}

/**
 * Load HTMLImageElement safely from URL
 */
export function loadImageAsync(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith("http://") || url.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Failed to load source image for variations"));
    img.src = url;
  });
}

/**
 * Calculate interpolation factor `t` (0 to 1) according to distribution mode
 */
function calculateFactor(frameIdx: number, totalFrames: number, mode: DistributionMode): number {
  if (totalFrames <= 1) return 0;
  
  if (mode === "linear") {
    return frameIdx / (totalFrames - 1);
  }
  
  if (mode === "loop") {
    // Ping-pong: 0 -> 1 -> 0
    const half = (totalFrames - 1) / 2;
    if (half === 0) return 0;
    if (frameIdx <= half) {
      return frameIdx / half;
    } else {
      return (totalFrames - 1 - frameIdx) / half;
    }
  }
  
  if (mode === "oscillate") {
    // Smooth sinusoidal wave
    const angle = (frameIdx / totalFrames) * Math.PI * 2;
    return (Math.sin(angle) + 1) / 2;
  }
  
  if (mode === "random") {
    // Deterministic pseudo-randomness based on frame index
    const seed = Math.sin(frameIdx * 997.13 + 12.34) * 43758.5453;
    return Math.abs(seed - Math.floor(seed));
  }
  
  return frameIdx / (totalFrames - 1);
}

/**
 * Generate all variations of a source image using HTML5 canvas
 */
export async function generateVariationsSeries(
  sourceImage: HTMLImageElement,
  baseName: string,
  config: VariationsStudioConfig,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<GeneratedVariationFrame[]> {
  const { frameCount, distributionMode } = config;
  const width = sourceImage.naturalWidth || sourceImage.width;
  const height = sourceImage.naturalHeight || sourceImage.height;

  if (!width || !height) {
    throw new Error("Invalid source image dimensions");
  }

  // Work on a main offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not initialize 2D context");

  // Scratch canvas for intermediate effects
  const scratchCanvas = document.createElement("canvas");
  scratchCanvas.width = width;
  scratchCanvas.height = height;
  const scratchCtx = scratchCanvas.getContext("2d", { willReadFrequently: true });

  const results: GeneratedVariationFrame[] = [];

  for (let f = 0; f < frameCount; f++) {
    const factor = calculateFactor(f, frameCount, distributionMode);
    // Secondary cycle for wave motion
    const wavePhase = (f / frameCount) * Math.PI * 2;

    if (onProgress) {
      onProgress(f + 1, frameCount, `Synthesizing variation frame ${f + 1} of ${frameCount}...`);
    }

    ctx.clearRect(0, 0, width, height);

    // 1. Calculate Spatial Motion & Zoom Transforms
    let dx = 0;
    let dy = 0;
    let rotationDeg = 0;
    let scale = 1.0;

    // Auto-overscan slightly zooms base by 5% so spatial movement doesn't reveal transparent borders
    if (config.autoOverscan && (config.spatialMotion.enabled || config.zoom.enabled)) {
      scale *= 1.06;
    }

    // Zoom
    if (config.zoom.enabled) {
      const zoomStrengthRatio = (config.zoom.strength / 100) * 0.45; // up to ~1.45x
      if (config.zoom.mode === "zoom_in") {
        scale *= 1.0 + zoomStrengthRatio * factor;
      } else if (config.zoom.mode === "zoom_out") {
        scale *= 1.0 + zoomStrengthRatio * (1 - factor);
      } else {
        // pulse
        scale *= 1.0 + zoomStrengthRatio * Math.sin(wavePhase);
      }
    }

    // Spatial Movement (Illusion of Motion)
    if (config.spatialMotion.enabled) {
      const dist = config.spatialMotion.distance;
      const tilt = config.spatialMotion.tiltAngle;

      if (config.spatialMotion.mode === "lateral_pan") {
        // Horizontal camera tracking
        dx = Math.sin(wavePhase) * dist;
        rotationDeg = Math.sin(wavePhase) * tilt;
      } else if (config.spatialMotion.mode === "vertical_bob") {
        // Vertical breathing bob
        dy = Math.cos(wavePhase) * dist;
        rotationDeg = Math.sin(wavePhase * 0.5) * (tilt * 0.5);
      } else if (config.spatialMotion.mode === "handheld_shake") {
        // Organic handheld shake
        const jitterX = Math.sin(f * 3.7 + 1.2) * dist;
        const jitterY = Math.cos(f * 2.9 + 2.1) * (dist * 0.8);
        dx = jitterX;
        dy = jitterY;
        rotationDeg = Math.sin(f * 4.1) * tilt;
      } else if (config.spatialMotion.mode === "diagonal_kinetic") {
        // Thrust vector
        dx = Math.sin(wavePhase) * dist;
        dy = Math.sin(wavePhase * 2) * (dist * 0.7);
        rotationDeg = Math.cos(wavePhase) * tilt;
      } else {
        // micro_tilt
        rotationDeg = Math.sin(wavePhase) * tilt;
      }
    }

    // 2. Setup CSS filter for Color & Exposure
    const filterParts: string[] = [];

    if (config.color.enabled) {
      if (config.color.mode === "hue_shift") {
        const hue = config.color.hueDelta * (factor * 2 - 1);
        filterParts.push(`hue-rotate(${hue}deg)`);
      } else if (config.color.mode === "saturation_cycle") {
        const sat = Math.max(0, 100 + config.color.saturationDelta * Math.sin(wavePhase));
        filterParts.push(`saturate(${sat}%)`);
      } else if (config.color.mode === "warm_cool") {
        // Warm temperature adds slight sepia/contrast; cool reduces warmth
        const temp = config.color.temperature * factor;
        if (temp > 0) {
          filterParts.push(`sepia(${temp * 0.4}%)`);
        } else {
          filterParts.push(`hue-rotate(${temp * 0.5}deg)`);
        }
      } else if (config.color.mode === "vintage") {
        filterParts.push(`sepia(${30 * factor}%) contrast(${90 + 20 * factor}%)`);
      }
    }

    if (config.exposureStrobe.enabled) {
      const bDelta = config.exposureStrobe.brightnessDelta * (Math.sin(wavePhase * 3));
      const cDelta = config.exposureStrobe.contrastDelta * (Math.cos(wavePhase * 2));
      filterParts.push(`brightness(${100 + bDelta}%)`);
      filterParts.push(`contrast(${100 + cDelta}%)`);
    }

    ctx.filter = filterParts.length > 0 ? filterParts.join(" ") : "none";

    // 3. Draw base image with transform
    ctx.save();
    ctx.translate(width / 2 + dx, height / 2 + dy);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(sourceImage, -width / 2, -height / 2, width, height);
    ctx.restore();
    ctx.filter = "none";

    // 4. Directional Motion Blur or Radial Blur
    if (config.blur.enabled && config.blur.strength > 0) {
      const blurAmount = config.blur.strength * (distributionMode === "random" ? factor : Math.abs(Math.sin(wavePhase)));
      if (blurAmount > 1) {
        if (config.blur.mode === "motion_blur") {
          // Directional kinetic motion blur pass along motion axis
          const rad = (config.blur.angle * Math.PI) / 180;
          const stepX = Math.cos(rad) * (blurAmount / 4);
          const stepY = Math.sin(rad) * (blurAmount / 4);

          ctx.save();
          ctx.globalAlpha = 0.18;
          for (let s = 1; s <= 4; s++) {
            ctx.drawImage(canvas, s * stepX, s * stepY);
            ctx.drawImage(canvas, -s * stepX, -s * stepY);
          }
          ctx.restore();
        } else if (config.blur.mode === "radial_blur") {
          // Explosive radial zoom blur
          ctx.save();
          ctx.globalAlpha = 0.15;
          for (let z = 1; z <= 3; z++) {
            const zScale = 1 + (z * blurAmount * 0.003);
            ctx.drawImage(canvas, (width - width * zScale) / 2, (height - height * zScale) / 2, width * zScale, height * zScale);
          }
          ctx.restore();
        } else if (config.blur.mode === "lens_bokeh") {
          // Soft lens bokeh glow
          if (scratchCtx) {
            scratchCtx.clearRect(0, 0, width, height);
            scratchCtx.filter = `blur(${Math.min(12, blurAmount * 0.6)}px)`;
            scratchCtx.drawImage(canvas, 0, 0);
            scratchCtx.filter = "none";

            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.drawImage(scratchCanvas, 0, 0);
            ctx.restore();
          }
        }
      }
    }

    // 5. Distortion (Wave Ripple / Glitch / Pinch)
    if (config.distortion.enabled && config.distortion.intensity > 0) {
      const distAmt = config.distortion.intensity * Math.sin(wavePhase);
      if (Math.abs(distAmt) > 2) {
        if (config.distortion.mode === "wave_ripple") {
          // Slice canvas into horizontal strips and displace with sine wave
          if (scratchCtx) {
            scratchCtx.clearRect(0, 0, width, height);
            scratchCtx.drawImage(canvas, 0, 0);

            ctx.clearRect(0, 0, width, height);
            const stripHeight = 6;
            const numStrips = Math.ceil(height / stripHeight);
            const freq = (config.distortion.frequency || 3) * 0.03;

            for (let i = 0; i < numStrips; i++) {
              const sy = i * stripHeight;
              const sh = Math.min(stripHeight, height - sy);
              const xOffset = Math.sin(sy * freq + wavePhase * 2) * (distAmt * 0.4);
              ctx.drawImage(scratchCanvas, 0, sy, width, sh, xOffset, sy, width, sh);
            }
          }
        } else if (config.distortion.mode === "horizontal_glitch") {
          // Sci-Fi digital horizontal slice displacement
          if (scratchCtx) {
            scratchCtx.clearRect(0, 0, width, height);
            scratchCtx.drawImage(canvas, 0, 0);

            const glitchStrips = Math.floor(3 + Math.abs(distAmt * 0.15));
            for (let g = 0; g < glitchStrips; g++) {
              const gy = (Math.sin(g * 17.3 + f * 5.1) * 0.5 + 0.5) * height;
              const gh = 10 + (Math.sin(g * 11.1) * 0.5 + 0.5) * 35;
              const gx = (Math.cos(g * 29.5 + f * 4.3)) * (distAmt * 0.8);
              ctx.drawImage(scratchCanvas, 0, gy, width, gh, gx, gy, width, gh);
            }
          }
        }
      }
    }

    // 6. RGB Channel Split / Chromatic Aberration
    if (config.rgbSplit.enabled && config.rgbSplit.offset > 0) {
      const splitDist = config.rgbSplit.offset * (0.5 + 0.5 * Math.sin(wavePhase));
      if (splitDist > 1 && scratchCtx) {
        // Isolate Red channel on scratchCanvas
        scratchCtx.clearRect(0, 0, width, height);
        scratchCtx.drawImage(canvas, 0, 0);
        
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        // Cyan / Blue offset
        ctx.globalAlpha = 0.5;
        const rad = (config.rgbSplit.angle * Math.PI) / 180;
        ctx.drawImage(scratchCanvas, Math.cos(rad) * splitDist, Math.sin(rad) * splitDist);
        ctx.restore();
      }
    }

    // 7. Light Leak & Optical Flare Glow
    if (config.lightLeak.enabled && config.lightLeak.intensity > 0) {
      const leakFactor = (config.lightLeak.intensity / 100) * (0.6 + 0.4 * Math.sin(wavePhase));
      let leakColor1 = "rgba(255, 180, 50, 0.75)";
      let leakColor2 = "rgba(255, 90, 0, 0.35)";

      if (config.lightLeak.theme === "cool_cyan") {
        leakColor1 = "rgba(0, 240, 255, 0.7)";
        leakColor2 = "rgba(10, 100, 255, 0.3)";
      } else if (config.lightLeak.theme === "magenta_neon") {
        leakColor1 = "rgba(255, 0, 180, 0.7)";
        leakColor2 = "rgba(140, 0, 255, 0.35)";
      } else if (config.lightLeak.theme === "golden_hour") {
        leakColor1 = "rgba(255, 215, 0, 0.8)";
        leakColor2 = "rgba(255, 140, 0, 0.4)";
      }

      const gradRadius = Math.max(width, height) * 0.75;
      let startX = 0;
      let startY = 0;
      if (config.lightLeak.position === "top_right") {
        startX = width;
        startY = 0;
      } else if (config.lightLeak.position === "bottom_left") {
        startX = 0;
        startY = height;
      } else if (config.lightLeak.position === "bottom_right") {
        startX = width;
        startY = height;
      }

      const leakGrad = ctx.createRadialGradient(startX, startY, 10, startX, startY, gradRadius);
      leakGrad.addColorStop(0, leakColor1);
      leakGrad.addColorStop(0.5, leakColor2);
      leakGrad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.globalAlpha = leakFactor;
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = leakGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 8. Vignette & Lens Falloff
    if (config.vignette.enabled && config.vignette.intensity > 0) {
      const vRadius = (config.vignette.radius / 100) * (Math.max(width, height) * 0.65);
      const vGrad = ctx.createRadialGradient(width / 2, height / 2, vRadius * 0.4, width / 2, height / 2, vRadius);
      vGrad.addColorStop(0, "rgba(0,0,0,0)");
      vGrad.addColorStop(1, `rgba(0,0,0,${config.vignette.intensity / 100})`);

      ctx.save();
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 9. Film Grain & Texture
    if (config.grain.enabled && config.grain.intensity > 0) {
      const grainStrength = (config.grain.intensity / 100) * 0.35;
      const grainCanvas = document.createElement("canvas");
      // Downscaled grain for retro feel
      const gWidth = config.grain.size === "fine" ? width : Math.floor(width / 2);
      const gHeight = config.grain.size === "fine" ? height : Math.floor(height / 2);
      grainCanvas.width = gWidth;
      grainCanvas.height = gHeight;
      const gCtx = grainCanvas.getContext("2d");

      if (gCtx) {
        const imgData = gCtx.createImageData(gWidth, gHeight);
        const data = imgData.data;
        const len = data.length;
        // Pseudo-random noise per frame
        for (let i = 0; i < len; i += 4) {
          const rand = (Math.random() - 0.5) * 255;
          if (config.grain.colored) {
            data[i] = Math.random() * 255;
            data[i + 1] = Math.random() * 255;
            data[i + 2] = Math.random() * 255;
          } else {
            data[i] = rand > 0 ? 255 : 0;
            data[i + 1] = rand > 0 ? 255 : 0;
            data[i + 2] = rand > 0 ? 255 : 0;
          }
          data[i + 3] = Math.abs(rand);
        }
        gCtx.putImageData(imgData, 0, 0);

        ctx.save();
        ctx.globalAlpha = grainStrength;
        ctx.globalCompositeOperation = "overlay";
        ctx.drawImage(grainCanvas, 0, 0, width, height);
        ctx.restore();
      }
    }

    // 10. Posterize & Edge Glow
    if (config.posterize.enabled && config.posterize.steps > 0) {
      const steps = Math.max(2, config.posterize.steps);
      const stepSize = 255 / steps;
      const frameImgData = ctx.getImageData(0, 0, width, height);
      const px = frameImgData.data;
      const pxLen = px.length;

      for (let p = 0; p < pxLen; p += 4) {
        px[p] = Math.floor(px[p] / stepSize) * stepSize;
        px[p + 1] = Math.floor(px[p + 1] / stepSize) * stepSize;
        px[p + 2] = Math.floor(px[p + 2] / stepSize) * stepSize;
      }
      ctx.putImageData(frameImgData, 0, 0);
    }

    // Export frame as clean data URL
    const frameDataUrl = canvas.toDataURL("image/jpeg", 0.94);
    const frameName = `${baseName}_var_${String(f + 1).padStart(2, "0")}`;

    // Summary description of active variations
    const summaryItems: string[] = [];
    if (config.zoom.enabled) summaryItems.push(`Zoom ${(scale * 100).toFixed(0)}%`);
    if (config.spatialMotion.enabled) summaryItems.push(`Motion (${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`);
    if (config.blur.enabled) summaryItems.push(`Blur`);
    if (config.distortion.enabled) summaryItems.push(`Warp`);
    if (config.color.enabled) summaryItems.push(`Color Grade`);

    results.push({
      id: `var-frame-${f + 1}`,
      frameIndex: f,
      name: frameName,
      url: frameDataUrl,
      progress: factor,
      summary: summaryItems.length > 0 ? summaryItems.join(", ") : "Standard Frame",
    });
  }

  return results;
}
