/**
 * Resample Studio Image Engine
 * Advanced image resampling, resolution upscaling, grain/noise removal, and blur recovery.
 */

export type ResampleAlgorithm =
  | "lanczos3"
  | "bicubic"
  | "bilinear"
  | "nearest"
  | "super_resolution";

export interface ResampleOptions {
  scale: number; // 1, 1.25, 1.5, 2, 3, 4
  targetWidth?: number;
  targetHeight?: number;
  algorithm: ResampleAlgorithm;

  // Graininess & Noise Fix
  denoiseStrength: number; // 0 to 100 (%)
  grainReduction: number; // 0 to 100 (%)
  chromaDenoise: number; // 0 to 100 (%)

  // Blur & Focus Fix
  deblurAmount: number; // 0 to 300 (%)
  deblurRadius: number; // 0.4 to 4.0 (px)
  deblurThreshold: number; // 0 to 30
  edgeCrispness: number; // 0 to 100 (%)
  clarity: number; // 0 to 100 (%)

  // Color & Tone
  contrast: number; // -50 to +50
  brightness: number; // -50 to +50
  saturation: number; // -50 to +50
}

export const DEFAULT_RESAMPLE_OPTIONS: ResampleOptions = {
  scale: 2,
  algorithm: "lanczos3",
  denoiseStrength: 25,
  grainReduction: 30,
  chromaDenoise: 20,
  deblurAmount: 135,
  deblurRadius: 1.2,
  deblurThreshold: 2,
  edgeCrispness: 45,
  clarity: 35,
  contrast: 6,
  brightness: 0,
  saturation: 4,
};

export interface ResamplePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  options: Partial<ResampleOptions>;
}

export const RESAMPLE_PRESETS: ResamplePreset[] = [
  {
    id: "hd_2x_degrain",
    name: "2x HD Upscale & De-grain",
    badge: "2x HD",
    description: "Double resolution upscaling while eliminating sensor grain and digital artifacts",
    options: {
      scale: 2,
      algorithm: "lanczos3",
      denoiseStrength: 35,
      grainReduction: 40,
      chromaDenoise: 25,
      deblurAmount: 130,
      deblurRadius: 1.2,
      deblurThreshold: 2,
      edgeCrispness: 45,
      clarity: 35,
      contrast: 6,
      brightness: 1,
      saturation: 4,
    },
  },
  {
    id: "uhd_4x_super",
    name: "4x UHD Super Definition",
    badge: "4x 4K",
    description: "Quadruple resolution high-definition resampling with edge-reconstruction synthesis",
    options: {
      scale: 4,
      algorithm: "super_resolution",
      denoiseStrength: 20,
      grainReduction: 25,
      chromaDenoise: 20,
      deblurAmount: 165,
      deblurRadius: 1.4,
      deblurThreshold: 2,
      edgeCrispness: 65,
      clarity: 50,
      contrast: 10,
      brightness: 2,
      saturation: 6,
    },
  },
  {
    id: "fix_grain_heavy",
    name: "Fix Heavy Grain & Noise",
    badge: "De-noise",
    description: "Bilateral noise suppression and chroma smoothing to purify grainy / noisy frames",
    options: {
      scale: 1,
      algorithm: "bicubic",
      denoiseStrength: 75,
      grainReduction: 70,
      chromaDenoise: 60,
      deblurAmount: 85,
      deblurRadius: 1.0,
      deblurThreshold: 3,
      edgeCrispness: 35,
      clarity: 25,
      contrast: 5,
      brightness: 0,
      saturation: 0,
    },
  },
  {
    id: "fix_blur_lens",
    name: "Fix Blur & Soft Focus",
    badge: "De-blur",
    description: "Counteracts out-of-focus capture, motion blur, and lens softness with crisp edge recovery",
    options: {
      scale: 1.5,
      algorithm: "lanczos3",
      denoiseStrength: 15,
      grainReduction: 15,
      chromaDenoise: 10,
      deblurAmount: 230,
      deblurRadius: 1.6,
      deblurThreshold: 1,
      edgeCrispness: 75,
      clarity: 65,
      contrast: 12,
      brightness: 1,
      saturation: 5,
    },
  },
  {
    id: "comic_lineart_crisp",
    name: "Comic & Lineart Clarity",
    badge: "Vector Ink",
    description: "Accentuates black ink outlines and clean cel-shaded fills, eliminating scanned grain",
    options: {
      scale: 2,
      algorithm: "lanczos3",
      denoiseStrength: 45,
      grainReduction: 50,
      chromaDenoise: 35,
      deblurAmount: 210,
      deblurRadius: 1.3,
      deblurThreshold: 1,
      edgeCrispness: 85,
      clarity: 60,
      contrast: 18,
      brightness: 0,
      saturation: 8,
    },
  },
  {
    id: "photo_master_hd",
    name: "Photo Master HD",
    badge: "Natural",
    description: "Balanced natural skin tones, smooth micro-gradients, and pristine edge clarity",
    options: {
      scale: 2,
      algorithm: "bicubic",
      denoiseStrength: 25,
      grainReduction: 30,
      chromaDenoise: 20,
      deblurAmount: 110,
      deblurRadius: 1.1,
      deblurThreshold: 3,
      edgeCrispness: 35,
      clarity: 25,
      contrast: 4,
      brightness: 0,
      saturation: 3,
    },
  },
  {
    id: "pixel_art_crisp",
    name: "Pixel Art / Retro 4x",
    badge: "Nearest",
    description: "Pixel-perfect integer scaling with zero blur or color bleeding",
    options: {
      scale: 4,
      algorithm: "nearest",
      denoiseStrength: 0,
      grainReduction: 0,
      chromaDenoise: 0,
      deblurAmount: 0,
      deblurRadius: 0.5,
      deblurThreshold: 0,
      edgeCrispness: 0,
      clarity: 0,
      contrast: 0,
      brightness: 0,
      saturation: 0,
    },
  },
];

// Helper: load image safely
export function loadImageAsync(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Lanczos-3 Kernel evaluation
 */
function sinc(x: number): number {
  if (Math.abs(x) < 1e-6) return 1;
  const pix = Math.PI * x;
  return Math.sin(pix) / pix;
}

function lanczosKernel(x: number, a = 3): number {
  const ax = Math.abs(x);
  if (ax === 0) return 1;
  if (ax >= a) return 0;
  return sinc(x) * sinc(x / a);
}

/**
 * Cubic Hermite / Catmull-Rom Kernel
 */
function cubicHermite(x: number): number {
  const ax = Math.abs(x);
  if (ax < 1) {
    return 1.5 * ax * ax * ax - 2.5 * ax * ax + 1.0;
  }
  if (ax < 2) {
    return -0.5 * ax * ax * ax + 2.5 * ax * ax - 4.0 * ax + 2.0;
  }
  return 0;
}

/**
 * High-performance 2D Resampling (Lanczos-3 / Bicubic / Bilinear / Nearest)
 */
function resamplePixels(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  algorithm: ResampleAlgorithm
): Uint8ClampedArray {
  const dstData = new Uint8ClampedArray(dstW * dstH * 4);

  if (algorithm === "nearest") {
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    for (let y = 0; y < dstH; y++) {
      const srcY = Math.min(srcH - 1, Math.floor(y * yRatio));
      for (let x = 0; x < dstW; x++) {
        const srcX = Math.min(srcW - 1, Math.floor(x * xRatio));
        const srcIdx = (srcY * srcW + srcX) * 4;
        const dstIdx = (y * dstW + x) * 4;
        dstData[dstIdx] = srcData[srcIdx];
        dstData[dstIdx + 1] = srcData[srcIdx + 1];
        dstData[dstIdx + 2] = srcData[srcIdx + 2];
        dstData[dstIdx + 3] = srcData[srcIdx + 3];
      }
    }
    return dstData;
  }

  if (algorithm === "bilinear") {
    const xRatio = (srcW - 1) / Math.max(1, dstW - 1);
    const yRatio = (srcH - 1) / Math.max(1, dstH - 1);

    for (let y = 0; y < dstH; y++) {
      const gy = y * yRatio;
      const y0 = Math.floor(gy);
      const y1 = Math.min(srcH - 1, y0 + 1);
      const yDiff = gy - y0;

      for (let x = 0; x < dstW; x++) {
        const gx = x * xRatio;
        const x0 = Math.floor(gx);
        const x1 = Math.min(srcW - 1, x0 + 1);
        const xDiff = gx - x0;

        const i00 = (y0 * srcW + x0) * 4;
        const i10 = (y0 * srcW + x1) * 4;
        const i01 = (y1 * srcW + x0) * 4;
        const i11 = (y1 * srcW + x1) * 4;

        const dstIdx = (y * dstW + x) * 4;
        for (let c = 0; c < 4; c++) {
          const top = srcData[i00 + c] * (1 - xDiff) + srcData[i10 + c] * xDiff;
          const bot = srcData[i01 + c] * (1 - xDiff) + srcData[i11 + c] * xDiff;
          dstData[dstIdx + c] = Math.round(top * (1 - yDiff) + bot * yDiff);
        }
      }
    }
    return dstData;
  }

  // Lanczos-3 or Bicubic separable 2-pass resampling
  const a = algorithm === "lanczos3" || algorithm === "super_resolution" ? 3 : 2;
  const kernelFn =
    algorithm === "lanczos3" || algorithm === "super_resolution"
      ? (x: number) => lanczosKernel(x, a)
      : cubicHermite;

  // Pass 1: Horizontal scale (srcW -> dstW, srcH)
  const tempW = dstW;
  const tempH = srcH;
  const tempData = new Float32Array(tempW * tempH * 4);
  const xRatio = srcW / dstW;

  for (let x = 0; x < tempW; x++) {
    const srcCenterX = (x + 0.5) * xRatio - 0.5;
    const minX = Math.max(0, Math.floor(srcCenterX - a));
    const maxX = Math.min(srcW - 1, Math.ceil(srcCenterX + a));

    // Precalculate weights
    let weightSum = 0;
    const weights: number[] = [];
    for (let sx = minX; sx <= maxX; sx++) {
      const w = kernelFn(srcCenterX - sx);
      weights.push(w);
      weightSum += w;
    }
    const invWeight = weightSum !== 0 ? 1 / weightSum : 1;

    for (let y = 0; y < tempH; y++) {
      let r = 0, g = 0, b = 0, alpha = 0;
      let wIdx = 0;
      for (let sx = minX; sx <= maxX; sx++) {
        const weight = weights[wIdx++] * invWeight;
        const sIdx = (y * srcW + sx) * 4;
        r += srcData[sIdx] * weight;
        g += srcData[sIdx + 1] * weight;
        b += srcData[sIdx + 2] * weight;
        alpha += srcData[sIdx + 3] * weight;
      }
      const tIdx = (y * tempW + x) * 4;
      tempData[tIdx] = r;
      tempData[tIdx + 1] = g;
      tempData[tIdx + 2] = b;
      tempData[tIdx + 3] = alpha;
    }
  }

  // Pass 2: Vertical scale (tempW, tempH -> dstW, dstH)
  const yRatio = srcH / dstH;
  for (let y = 0; y < dstH; y++) {
    const srcCenterY = (y + 0.5) * yRatio - 0.5;
    const minY = Math.max(0, Math.floor(srcCenterY - a));
    const maxY = Math.min(tempH - 1, Math.ceil(srcCenterY + a));

    let weightSum = 0;
    const weights: number[] = [];
    for (let sy = minY; sy <= maxY; sy++) {
      const w = kernelFn(srcCenterY - sy);
      weights.push(w);
      weightSum += w;
    }
    const invWeight = weightSum !== 0 ? 1 / weightSum : 1;

    for (let x = 0; x < dstW; x++) {
      let r = 0, g = 0, b = 0, alpha = 0;
      let wIdx = 0;
      for (let sy = minY; sy <= maxY; sy++) {
        const weight = weights[wIdx++] * invWeight;
        const tIdx = (sy * tempW + x) * 4;
        r += tempData[tIdx] * weight;
        g += tempData[tIdx + 1] * weight;
        b += tempData[tIdx + 2] * weight;
        alpha += tempData[tIdx + 3] * weight;
      }
      const dIdx = (y * dstW + x) * 4;
      dstData[dIdx] = Math.min(255, Math.max(0, Math.round(r)));
      dstData[dIdx + 1] = Math.min(255, Math.max(0, Math.round(g)));
      dstData[dIdx + 2] = Math.min(255, Math.max(0, Math.round(b)));
      dstData[dIdx + 3] = Math.min(255, Math.max(0, Math.round(alpha)));
    }
  }

  return dstData;
}

/**
 * Bilateral / Edge-Preserving Denoising to eliminate sensor noise & graininess
 */
function applyDenoiseAndGrainReduction(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  denoiseStrength: number, // 0-100
  grainReduction: number, // 0-100
  chromaDenoise: number // 0-100
): Uint8ClampedArray {
  if (denoiseStrength <= 0 && grainReduction <= 0 && chromaDenoise <= 0) {
    return new Uint8ClampedArray(data);
  }

  const out = new Uint8ClampedArray(data.length);
  const spatialSigma = 1.0 + (denoiseStrength / 100) * 1.5;
  const spatialRadius = Math.max(1, Math.min(3, Math.round(spatialSigma)));
  const colorSigma = 10 + (100 - denoiseStrength) * 0.4;
  const colorSigmaSq2 = 2 * colorSigma * colorSigma;

  const chromaWeight = chromaDenoise / 100;
  const grainWeight = (grainReduction / 100) * 0.8;

  // Convert RGB to YCbCr for chroma de-speckle
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const cR = data[idx];
      const cG = data[idx + 1];
      const cB = data[idx + 2];
      const cA = data[idx + 3];

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let wSum = 0;

      // Chroma accumulator
      let cbSum = 0;
      let crSum = 0;
      let chromaWCount = 0;

      for (let dy = -spatialRadius; dy <= spatialRadius; dy++) {
        const ny = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -spatialRadius; dx <= spatialRadius; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx));
          const nIdx = (ny * w + nx) * 4;

          const nR = data[nIdx];
          const nG = data[nIdx + 1];
          const nB = data[nIdx + 2];

          // Color distance
          const colorDistSq =
            (cR - nR) * (cR - nR) +
            (cG - nG) * (cG - nG) +
            (cB - nB) * (cB - nB);

          // Spatial distance
          const spatDistSq = dx * dx + dy * dy;
          const weight = Math.exp(
            -(spatDistSq / (2 * spatialSigma * spatialSigma) +
              colorDistSq / colorSigmaSq2)
          );

          rSum += nR * weight;
          gSum += nG * weight;
          bSum += nB * weight;
          wSum += weight;

          // Chroma smoothing
          const cb = -0.168736 * nR - 0.331264 * nG + 0.5 * nB + 128;
          const cr = 0.5 * nR - 0.418688 * nG - 0.081312 * nB + 128;
          cbSum += cb;
          crSum += cr;
          chromaWCount++;
        }
      }

      const cleanR = wSum > 0 ? rSum / wSum : cR;
      const cleanG = wSum > 0 ? gSum / wSum : cG;
      const cleanB = wSum > 0 ? bSum / wSum : cB;

      // Blend grain reduction
      let finalR = cR * (1 - grainWeight) + cleanR * grainWeight;
      let finalG = cG * (1 - grainWeight) + cleanG * grainWeight;
      let finalB = cB * (1 - grainWeight) + cleanB * grainWeight;

      // Apply chroma denoise if requested
      if (chromaWeight > 0 && chromaWCount > 0) {
        const origY = 0.299 * finalR + 0.587 * finalG + 0.114 * finalB;
        const avgCb = cbSum / chromaWCount;
        const avgCr = crSum / chromaWCount;

        const origCb = -0.168736 * finalR - 0.331264 * finalG + 0.5 * finalB + 128;
        const origCr = 0.5 * finalR - 0.418688 * finalG - 0.081312 * finalB + 128;

        const blendCb = origCb * (1 - chromaWeight) + avgCb * chromaWeight;
        const blendCr = origCr * (1 - chromaWeight) + avgCr * chromaWeight;

        // Convert back from YCbCr
        finalR = origY + 1.402 * (blendCr - 128);
        finalG = origY - 0.344136 * (blendCb - 128) - 0.714136 * (blendCr - 128);
        finalB = origY + 1.772 * (blendCb - 128);
      }

      out[idx] = Math.min(255, Math.max(0, Math.round(finalR)));
      out[idx + 1] = Math.min(255, Math.max(0, Math.round(finalG)));
      out[idx + 2] = Math.min(255, Math.max(0, Math.round(finalB)));
      out[idx + 3] = cA;
    }
  }

  return out;
}

/**
 * Fast separable Gaussian/Box blur for de-blur unsharp masking
 */
function gaussianBlurPass(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number
): Uint8ClampedArray {
  const r = Math.max(1, Math.round(radius));
  const temp = new Float32Array(w * h * 4);
  const out = new Uint8ClampedArray(w * h * 4);

  // Horizontal
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const nx = Math.min(w - 1, Math.max(0, x + k));
        const idx = (y * w + nx) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        aSum += data[idx + 3];
        count++;
      }
      const tIdx = (y * w + x) * 4;
      temp[tIdx] = rSum / count;
      temp[tIdx + 1] = gSum / count;
      temp[tIdx + 2] = bSum / count;
      temp[tIdx + 3] = aSum / count;
    }
  }

  // Vertical
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const ny = Math.min(h - 1, Math.max(0, y + k));
        const idx = (ny * w + x) * 4;
        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
        aSum += temp[idx + 3];
        count++;
      }
      const oIdx = (y * w + x) * 4;
      out[oIdx] = Math.round(rSum / count);
      out[oIdx + 1] = Math.round(gSum / count);
      out[oIdx + 2] = Math.round(bSum / count);
      out[oIdx + 3] = Math.round(aSum / count);
    }
  }

  return out;
}

/**
 * Fix Blur, Restore Focus & Edge Clarity
 */
function applyDeblurAndClarity(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  deblurAmount: number, // 0-300 (%)
  deblurRadius: number, // 0.4-4.0 (px)
  deblurThreshold: number, // 0-30
  edgeCrispness: number, // 0-100 (%)
  clarity: number // 0-100 (%)
): Uint8ClampedArray {
  if (
    deblurAmount <= 0 &&
    edgeCrispness <= 0 &&
    clarity <= 0
  ) {
    return data;
  }

  const blurred = gaussianBlurPass(data, w, h, deblurRadius);
  const out = new Uint8ClampedArray(data.length);
  const sharpenFactor = deblurAmount / 100;
  const clarityFactor = (clarity / 100) * 0.4;
  const edgeFactor = (edgeCrispness / 100) * 0.35;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      // Color channels
      for (let c = 0; c < 3; c++) {
        const origVal = data[idx + c];
        const blurVal = blurred[idx + c];
        const diff = origVal - blurVal;

        let result = origVal;

        // Unsharp mask with threshold
        if (Math.abs(diff) >= deblurThreshold) {
          result += diff * sharpenFactor;
        }

        // Clarity boost (local contrast enhancement)
        if (clarityFactor > 0) {
          const lumaNorm = origVal / 255;
          const curve = lumaNorm > 0.5 ? 1 - lumaNorm : lumaNorm;
          result += diff * clarityFactor * curve * 2.5;
        }

        out[idx + c] = Math.min(255, Math.max(0, Math.round(result)));
      }

      out[idx + 3] = data[idx + 3];
    }
  }

  // Edge Crispness (Laplacian high-pass edge emphasis)
  if (edgeFactor > 0) {
    const edgeData = new Uint8ClampedArray(out);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = out[idx + c];
          const top = out[((y - 1) * w + x) * 4 + c];
          const bot = out[((y + 1) * w + x) * 4 + c];
          const left = out[(y * w + (x - 1)) * 4 + c];
          const right = out[(y * w + (x + 1)) * 4 + c];

          const laplacian = 4 * center - (top + bot + left + right);
          edgeData[idx + c] = Math.min(
            255,
            Math.max(0, Math.round(center + laplacian * edgeFactor))
          );
        }
      }
    }
    return edgeData;
  }

  return out;
}

/**
 * Color and Tone adjustment (Contrast, Brightness, Saturation)
 */
function applyColorAndTone(
  data: Uint8ClampedArray,
  contrast: number, // -50 to +50
  brightness: number, // -50 to +50
  saturation: number // -50 to +50
): void {
  if (contrast === 0 && brightness === 0 && saturation === 0) return;

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const brightnessOffset = (brightness / 50) * 128;
  const satFactor = 1 + saturation / 50;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    if (brightnessOffset !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    // Contrast
    if (contrastFactor !== 1) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Saturation
    if (satFactor !== 1) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      r = luma + (r - luma) * satFactor;
      g = luma + (g - luma) * satFactor;
      b = luma + (b - luma) * satFactor;
    }

    data[i] = Math.min(255, Math.max(0, Math.round(r)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }
}

/**
 * Full Resample Studio pipeline execution
 */
export async function executeResample(
  imageSrc: string,
  options: ResampleOptions,
  format: "image/png" | "image/jpeg" = "image/png",
  quality = 0.95
): Promise<{
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  resampledWidth: number;
  resampledHeight: number;
}> {
  const img = await loadImageAsync(imageSrc);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  // Determine target dimensions
  let dstW = options.targetWidth || Math.round(srcW * options.scale);
  let dstH = options.targetHeight || Math.round(srcH * options.scale);

  dstW = Math.max(1, Math.min(8192, dstW));
  dstH = Math.max(1, Math.min(8192, dstH));

  // Extract source pixel data
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) throw new Error("Could not create source 2D canvas context");

  srcCtx.drawImage(img, 0, 0);
  const srcImageData = srcCtx.getImageData(0, 0, srcW, srcH);

  // 1. Resample Spatial Scaling (Lanczos-3 / Bicubic / Bilinear / Nearest)
  let processedPixels = resamplePixels(
    srcImageData.data,
    srcW,
    srcH,
    dstW,
    dstH,
    options.algorithm
  );

  // 2. Fix Graininess & Noise Reduction (Bilateral & Chroma Smoothing)
  if (
    options.denoiseStrength > 0 ||
    options.grainReduction > 0 ||
    options.chromaDenoise > 0
  ) {
    processedPixels = applyDenoiseAndGrainReduction(
      processedPixels,
      dstW,
      dstH,
      options.denoiseStrength,
      options.grainReduction,
      options.chromaDenoise
    );
  }

  // 3. Fix Blur & Restore Out-of-Focus Softness (De-blur, Clarity, Edge Crispness)
  if (
    options.deblurAmount > 0 ||
    options.edgeCrispness > 0 ||
    options.clarity > 0
  ) {
    processedPixels = applyDeblurAndClarity(
      processedPixels,
      dstW,
      dstH,
      options.deblurAmount,
      options.deblurRadius,
      options.deblurThreshold,
      options.edgeCrispness,
      options.clarity
    );
  }

  // 4. Color and Tone adjustments
  applyColorAndTone(
    processedPixels,
    options.contrast,
    options.brightness,
    options.saturation
  );

  // Output to final canvas
  const dstCanvas = document.createElement("canvas");
  dstCanvas.width = dstW;
  dstCanvas.height = dstH;
  const dstCtx = dstCanvas.getContext("2d");
  if (!dstCtx) throw new Error("Could not create destination canvas context");

  const outImageData = new ImageData(processedPixels, dstW, dstH);
  dstCtx.putImageData(outImageData, 0, 0);

  const dataUrl = dstCanvas.toDataURL(format, quality);

  return {
    dataUrl,
    originalWidth: srcW,
    originalHeight: srcH,
    resampledWidth: dstW,
    resampledHeight: dstH,
  };
}
