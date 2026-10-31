/**
 * Image Resolution Sharpener & Enhancement Engine
 * High-performance client-side image upscaling, unsharp masking, and edge clarity boost.
 */

export interface SharpenerOptions {
  scale: number; // 1, 1.5, 2, 3, 4
  amount: number; // 0 to 300 (%)
  radius: number; // 0.5 to 4.0 (px)
  threshold: number; // 0 to 50
  clarity: number; // 0 to 100 (%)
  denoise: number; // 0 to 100 (%)
  contrast: number; // -50 to +50
  brightness: number; // -50 to +50
  saturation: number; // -50 to +50
  edgeCrispness: number; // 0 to 100 (%)
}

export const DEFAULT_SHARPENER_OPTIONS: SharpenerOptions = {
  scale: 2,
  amount: 140,
  radius: 1.2,
  threshold: 2,
  clarity: 35,
  denoise: 15,
  contrast: 6,
  brightness: 0,
  saturation: 4,
  edgeCrispness: 40,
};

export interface SharpenerPreset {
  id: string;
  name: string;
  description: string;
  options: SharpenerOptions;
}

export const SHARPENER_PRESETS: SharpenerPreset[] = [
  {
    id: "clean_crisp",
    name: "Clean & Crisp (1x)",
    description: "Preserves native resolution while removing softness and micro-blur",
    options: {
      scale: 1,
      amount: 120,
      radius: 1.0,
      threshold: 3,
      clarity: 30,
      denoise: 10,
      contrast: 5,
      brightness: 0,
      saturation: 0,
      edgeCrispness: 30,
    },
  },
  {
    id: "super_sharp_2x",
    name: "Super Sharp (2x HD)",
    description: "Double resolution upscaling with balanced edge enhancement and clarity",
    options: {
      scale: 2,
      amount: 150,
      radius: 1.2,
      threshold: 2,
      clarity: 45,
      denoise: 15,
      contrast: 8,
      brightness: 1,
      saturation: 4,
      edgeCrispness: 45,
    },
  },
  {
    id: "comic_line_art",
    name: "Comic & Line Art",
    description: "Accentuates ink outlines, text bubbles, and bold cell shading",
    options: {
      scale: 2,
      amount: 220,
      radius: 1.5,
      threshold: 1,
      clarity: 60,
      denoise: 25,
      contrast: 15,
      brightness: 0,
      saturation: 8,
      edgeCrispness: 75,
    },
  },
  {
    id: "ultra_detail_4x",
    name: "Ultra Clarity (4x UHD)",
    description: "4x Super-sample expansion with high-pass texture recovery",
    options: {
      scale: 4,
      amount: 175,
      radius: 1.4,
      threshold: 2,
      clarity: 55,
      denoise: 20,
      contrast: 10,
      brightness: 2,
      saturation: 5,
      edgeCrispness: 60,
    },
  },
  {
    id: "soft_deblur",
    name: "Gentle De-blur",
    description: "Recovers slightly out-of-focus crops without halo artifacts",
    options: {
      scale: 1,
      amount: 90,
      radius: 0.8,
      threshold: 5,
      clarity: 20,
      denoise: 5,
      contrast: 2,
      brightness: 0,
      saturation: 0,
      edgeCrispness: 20,
    },
  },
  {
    id: "maximum_punch",
    name: "Maximum Punch",
    description: "Aggressive sharpening, vivid contrast, and maximum micro-detail",
    options: {
      scale: 2,
      amount: 240,
      radius: 1.8,
      threshold: 0,
      clarity: 70,
      denoise: 10,
      contrast: 18,
      brightness: 2,
      saturation: 12,
      edgeCrispness: 80,
    },
  },
];

/**
 * Fast box blur / approximation for unsharp mask mask creation
 */
function boxBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const r = Math.max(1, Math.round(radius));
  const size = r * 2 + 1;

  // Horizontal pass
  const temp = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      for (let k = -r; k <= r; k++) {
        const px = Math.min(width - 1, Math.max(0, x + k));
        const idx = (y * width + px) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        aSum += data[idx + 3];
        count++;
      }

      const outIdx = (y * width + x) * 4;
      temp[outIdx] = rSum / count;
      temp[outIdx + 1] = gSum / count;
      temp[outIdx + 2] = bSum / count;
      temp[outIdx + 3] = aSum / count;
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      for (let k = -r; k <= r; k++) {
        const py = Math.min(height - 1, Math.max(0, y + k));
        const idx = (py * width + x) * 4;
        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
        aSum += temp[idx + 3];
        count++;
      }

      const outIdx = (y * width + x) * 4;
      output[outIdx] = rSum / count;
      output[outIdx + 1] = gSum / count;
      output[outIdx + 2] = bSum / count;
      output[outIdx + 3] = aSum / count;
    }
  }

  return output;
}

/**
 * High-pass edge detection filter
 */
function computeHighPass(
  original: Uint8ClampedArray,
  blurred: Uint8ClampedArray,
  length: number
): Float32Array {
  const hp = new Float32Array(length);
  for (let i = 0; i < length; i += 4) {
    hp[i] = original[i] - blurred[i];
    hp[i + 1] = original[i + 1] - blurred[i + 1];
    hp[i + 2] = original[i + 2] - blurred[i + 2];
  }
  return hp;
}

/**
 * Main processor: takes source canvas/image, options, and returns a new canvas
 */
export function processEnhancedImage(
  source: HTMLImageElement | HTMLCanvasElement,
  options: SharpenerOptions
): HTMLCanvasElement {
  const naturalWidth =
    "naturalWidth" in source ? source.naturalWidth : source.width;
  const naturalHeight =
    "naturalHeight" in source ? source.naturalHeight : source.height;

  const targetWidth = Math.max(1, Math.round(naturalWidth * options.scale));
  const targetHeight = Math.max(1, Math.round(naturalHeight * options.scale));

  // 1. Draw source scaled to target dimensions using high-quality image smoothing
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create 2D canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  // If no processing is requested (amount 0 and scale 1), return early
  if (
    options.amount === 0 &&
    options.clarity === 0 &&
    options.contrast === 0 &&
    options.brightness === 0 &&
    options.edgeCrispness === 0 &&
    options.scale === 1
  ) {
    return canvas;
  }

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;
  const length = data.length;

  // 2. Unsharp Mask: blur baseline
  const blurredData = boxBlur(
    data,
    targetWidth,
    targetHeight,
    Math.max(0.5, options.radius * options.scale)
  );

  // High-pass components for edge crispness
  const highPass =
    options.edgeCrispness > 0
      ? computeHighPass(data, blurredData, length)
      : null;

  const amountFactor = options.amount / 100;
  const thresholdVal = options.threshold;
  const clarityFactor = options.clarity / 100;
  const edgeFactor = (options.edgeCrispness / 100) * 1.5;
  const denoiseFactor = options.denoise / 100;

  // Tone adjustments factors
  const contrastFactor =
    (259 * (options.contrast * 2.55 + 255)) /
    (255 * (259 - options.contrast * 2.55));
  const brightnessOffset = options.brightness * 2.55;
  const satFactor = 1 + options.saturation / 100;

  for (let i = 0; i < length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue; // Skip pure transparent pixels

    const blR = blurredData[i];
    const blG = blurredData[i + 1];
    const blB = blurredData[i + 2];

    // USM Delta
    const diffR = r - blR;
    const diffG = g - blG;
    const diffB = b - blB;

    // Apply threshold: only sharpen if difference exceeds threshold
    let sharpR = r;
    let sharpG = g;
    let sharpB = b;

    if (Math.abs(diffR) >= thresholdVal) {
      sharpR += diffR * amountFactor;
    } else if (denoiseFactor > 0) {
      // Subtle denoising in flat areas
      sharpR = r * (1 - denoiseFactor * 0.5) + blR * (denoiseFactor * 0.5);
    }

    if (Math.abs(diffG) >= thresholdVal) {
      sharpG += diffG * amountFactor;
    } else if (denoiseFactor > 0) {
      sharpG = g * (1 - denoiseFactor * 0.5) + blG * (denoiseFactor * 0.5);
    }

    if (Math.abs(diffB) >= thresholdVal) {
      sharpB += diffB * amountFactor;
    } else if (denoiseFactor > 0) {
      sharpB = b * (1 - denoiseFactor * 0.5) + blB * (denoiseFactor * 0.5);
    }

    // Add High-Pass edge crispness
    if (highPass) {
      sharpR += highPass[i] * edgeFactor;
      sharpG += highPass[i + 1] * edgeFactor;
      sharpB += highPass[i + 2] * edgeFactor;
    }

    // Add Local Clarity (mid-tone micro-contrast)
    if (clarityFactor > 0) {
      const lum = 0.299 * sharpR + 0.587 * sharpG + 0.114 * sharpB;
      const midtoneWeight = Math.sin((lum / 255) * Math.PI); // Peak at 128
      const clarityDiff = (lum - 128) * clarityFactor * 0.4 * midtoneWeight;
      sharpR += clarityDiff;
      sharpG += clarityDiff;
      sharpB += clarityDiff;
    }

    // Apply Contrast & Brightness
    if (options.contrast !== 0 || options.brightness !== 0) {
      sharpR = contrastFactor * (sharpR - 128) + 128 + brightnessOffset;
      sharpG = contrastFactor * (sharpG - 128) + 128 + brightnessOffset;
      sharpB = contrastFactor * (sharpB - 128) + 128 + brightnessOffset;
    }

    // Apply Saturation
    if (options.saturation !== 0) {
      const gray = 0.2989 * sharpR + 0.587 * sharpG + 0.114 * sharpB;
      sharpR = gray + satFactor * (sharpR - gray);
      sharpG = gray + satFactor * (sharpG - gray);
      sharpB = gray + satFactor * (sharpB - gray);
    }

    // Clamp values 0 - 255
    data[i] = Math.min(255, Math.max(0, Math.round(sharpR)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(sharpG)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(sharpB)));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
