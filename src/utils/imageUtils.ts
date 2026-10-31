import type { Crop } from "react-image-crop";
import { GridLabelPreset, getSegmentPresetLabel } from "./gridLabelPresets";

/**
 * Renders the given image source cropped by the provided crop.
 * Supports both percentage crop and pixel crop, and optional DOM imageElement scaling.
 * Returns a base64 data URL of the cropped area.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Crop,
  format: "image/png" | "image/jpeg" = "image/jpeg",
  imageElement?: HTMLImageElement | null,
  isCircular?: boolean
): Promise<string> {
  if (!imageSrc) return "";
  try {
    const image = await loadImage(imageSrc);

    const naturalW = image.naturalWidth;
    const naturalH = image.naturalHeight;

    if (!naturalW || !naturalH) return imageSrc;

    if (!pixelCrop || !pixelCrop.width || !pixelCrop.height) {
      return imageSrc;
    }

    let x = 0;
    let y = 0;
    let width = naturalW;
    let height = naturalH;

    // Check if crop units are percent or pixels
    const isPercent = pixelCrop.unit === "%";

    if (isPercent) {
      x = ((pixelCrop.x || 0) / 100) * naturalW;
      y = ((pixelCrop.y || 0) / 100) * naturalH;
      width = ((pixelCrop.width || 0) / 100) * naturalW;
      height = ((pixelCrop.height || 0) / 100) * naturalH;
    } else {
      // Pixel crop: scale if imageElement DOM size differs from natural size
      if (imageElement && imageElement.clientWidth > 0 && imageElement.clientHeight > 0) {
        const scaleX = naturalW / imageElement.clientWidth;
        const scaleY = naturalH / imageElement.clientHeight;
        x = (pixelCrop.x || 0) * scaleX;
        y = (pixelCrop.y || 0) * scaleY;
        width = (pixelCrop.width || 0) * scaleX;
        height = (pixelCrop.height || 0) * scaleY;
      } else {
        x = pixelCrop.x || 0;
        y = pixelCrop.y || 0;
        width = pixelCrop.width || 0;
        height = pixelCrop.height || 0;
      }
    }

    // Clamp coordinates safely within natural bounds
    x = Math.max(0, Math.min(Math.round(x), naturalW - 1));
    y = Math.max(0, Math.min(Math.round(y), naturalH - 1));
    width = Math.max(1, Math.min(Math.round(width), naturalW - x));
    height = Math.max(1, Math.min(Math.round(height), naturalH - y));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageSrc;

    if (isCircular) {
      ctx.beginPath();
      if (typeof ctx.ellipse === "function") {
        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI);
      } else {
        ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
      }
      ctx.clip();
    }

    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

    const outputFormat = isCircular ? "image/png" : format;
    return canvas.toDataURL(outputFormat);
  } catch (err) {
    console.error("getCroppedImg error:", err);
    return imageSrc;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Empty image source"));
      return;
    }
    const img = new Image();
    if (src.startsWith("http://") || src.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image resource"));
    img.src = src;
  });
}

export type NumberingOrigin = "bottom-left" | "top-left" | "top-right" | "bottom-right";
export type NumberingFlow = "horizontal" | "vertical";
export type NamingStyle = "sequential" | "grid";

export interface GridCell {
  r: number;
  c: number;
  seq: number;
}

/**
 * Calculates the sequential traversal order of cells given grid dimensions,
 * numbering starting corner origin, and flow direction (horizontal vs vertical).
 */
export function getGridCellSequence(
  totalRows: number,
  totalCols: number,
  origin: NumberingOrigin = "top-left",
  flow: NumberingFlow = "horizontal"
): GridCell[] {
  const isBottomStart = origin === "bottom-left" || origin === "bottom-right";
  const rowIndices: number[] = [];
  if (isBottomStart) {
    for (let r = totalRows - 1; r >= 0; r--) rowIndices.push(r);
  } else {
    for (let r = 0; r < totalRows; r++) rowIndices.push(r);
  }

  const isRightStart = origin === "top-right" || origin === "bottom-right";
  const colIndices: number[] = [];
  if (isRightStart) {
    for (let c = totalCols - 1; c >= 0; c--) colIndices.push(c);
  } else {
    for (let c = 0; c < totalCols; c++) colIndices.push(c);
  }

  const cellPairs: GridCell[] = [];
  let seq = 1;
  if (flow === "horizontal") {
    for (const r of rowIndices) {
      for (const c of colIndices) {
        cellPairs.push({ r, c, seq: seq++ });
      }
    }
  } else {
    for (const c of colIndices) {
      for (const r of rowIndices) {
        cellPairs.push({ r, c, seq: seq++ });
      }
    }
  }
  return cellPairs;
}

export interface SliceOptions {
  origin?: NumberingOrigin;
  flow?: NumberingFlow;
  namingStyle?: NamingStyle;
  lineThickness?: number;
  lineThicknessX?: number;
  lineThicknessY?: number;
  outerMargin?: number;
  cellPadding?: number;
  gridLabelPreset?: GridLabelPreset;
  customGridLabelPrefix?: string;
  renderLabelOnImage?: boolean;
}

/**
 * Slices an image according to the given row/column cuts.
 * rowCuts and colCuts are pixel values within the image.
 * Options allow controlling numbering origin (e.g. bottom-left to top-right),
 * flow direction, file naming format, grid label preset naming, burn-in label rendering, and excluding cut line thickness.
 */
export async function sliceImage(
  imageSrc: string,
  rowCuts: number[],
  colCuts: number[],
  format: "image/png" | "image/jpeg" = "image/jpeg",
  options?: SliceOptions
): Promise<{ name: string; url: string; designation?: string }[]> {
  if (!imageSrc) return [];
  try {
    const image = await loadImage(imageSrc);
    const w = image.naturalWidth;
    const h = image.naturalHeight;

  // Build the row/column boundaries. Each cut is the *end* of a row/col.
  const rowBounds: number[] = [0, ...rowCuts, h].sort((a, b) => a - b);
  const colBounds: number[] = [0, ...colCuts, w].sort((a, b) => a - b);

  const totalRows = rowBounds.length - 1;
  const totalCols = colBounds.length - 1;
  const totalSlices = totalRows * totalCols;

  const origin = options?.origin || "top-left";
  const flow = options?.flow || "horizontal";
  const namingStyle = options?.namingStyle || "sequential";
  const defaultThickness = Math.max(0, options?.lineThickness || 0);
  const thicknessX = Math.max(0, options?.lineThicknessX ?? defaultThickness);
  const thicknessY = Math.max(0, options?.lineThicknessY ?? defaultThickness);

  const halfBeforeX = Math.floor(thicknessX / 2);
  const halfAfterX = Math.ceil(thicknessX / 2);
  const halfBeforeY = Math.floor(thicknessY / 2);
  const halfAfterY = Math.ceil(thicknessY / 2);

  // Generate cell traversal sequence
  const cellPairs = getGridCellSequence(totalRows, totalCols, origin, flow);

  const extension = format === "image/png" ? "png" : "jpg";
  const padLength = Math.max(2, String(totalSlices).length);
  const out: { name: string; url: string; designation?: string }[] = [];

  const outerMargin = Math.max(0, options?.outerMargin || 0);
  const cellPadding = options?.cellPadding || 0;

  for (let i = 0; i < cellPairs.length; i++) {
    const { r, c } = cellPairs[i];
    const seq = cellPairs[i].seq ?? (i + 1);
    let y0 = Math.round(r === 0 ? rowBounds[0] + outerMargin : rowBounds[r] + halfAfterY);
    let y1 = Math.round(r === totalRows - 1 ? rowBounds[totalRows] - outerMargin : rowBounds[r + 1] - halfBeforeY);
    let x0 = Math.round(c === 0 ? colBounds[0] + outerMargin : colBounds[c] + halfAfterX);
    let x1 = Math.round(c === totalCols - 1 ? colBounds[totalCols] - outerMargin : colBounds[c + 1] - halfBeforeX);

    // Apply internal cell padding (positive insets inward, negative expands outward to touch or bleed past edges)
    if (cellPadding !== 0) {
      const maxPadX = Math.floor((x1 - x0 - 2) / 2);
      const maxPadY = Math.floor((y1 - y0 - 2) / 2);
      const effectivePadX = cellPadding > 0 ? Math.min(cellPadding, Math.max(0, maxPadX)) : cellPadding;
      const effectivePadY = cellPadding > 0 ? Math.min(cellPadding, Math.max(0, maxPadY)) : cellPadding;

      x0 = Math.max(0, Math.min(w - 1, x0 + effectivePadX));
      x1 = Math.max(x0 + 1, Math.min(w, x1 - effectivePadX));
      y0 = Math.max(0, Math.min(h - 1, y0 + effectivePadY));
      y1 = Math.max(y0 + 1, Math.min(h, y1 - effectivePadY));
    }

    const sliceHeight = y1 - y0;
    if (sliceHeight <= 0) continue;
    const sliceWidth = x1 - x0;
    if (sliceWidth <= 0) continue;

    const canvas = document.createElement("canvas");
    canvas.width = sliceWidth;
    canvas.height = sliceHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.drawImage(
      image,
      x0,
      y0,
      sliceWidth,
      sliceHeight,
      0,
      0,
      sliceWidth,
      sliceHeight
    );

    const designation = options?.gridLabelPreset
      ? getSegmentPresetLabel(
          options.gridLabelPreset,
          { r, c, seq },
          options?.customGridLabelPrefix || "Shot"
        )
      : "";

    // If renderLabelOnImage is enabled and designation is present, render styled badge on slice
    if (options?.renderLabelOnImage && designation) {
      const minDim = Math.min(sliceWidth, sliceHeight);
      const badgeFontSize = Math.max(12, Math.min(32, Math.round(minDim * 0.085)));
      ctx.save();
      ctx.font = `bold ${badgeFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textMetrics = ctx.measureText(designation);
      const textWidth = textMetrics.width;
      const padX = Math.round(badgeFontSize * 0.52);
      const padY = Math.round(badgeFontSize * 0.32);
      const badgeW = Math.round(textWidth + padX * 2);
      const badgeH = Math.round(badgeFontSize + padY * 2);
      const margin = Math.round(badgeFontSize * 0.45);

      const bx = margin;
      const by = margin;
      const radius = Math.min(badgeH / 2, 7);

      // Pill shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = Math.round(badgeFontSize * 0.4);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.round(badgeFontSize * 0.15);

      // Pill backdrop
      ctx.fillStyle = "rgba(2, 6, 23, 0.90)";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
      ctx.lineWidth = Math.max(1.2, Math.round(badgeFontSize * 0.08));

      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(bx, by, badgeW, badgeH, radius);
      } else {
        ctx.rect(bx, by, badgeW, badgeH);
      }
      ctx.fill();
      ctx.stroke();

      // Reset shadow for crisp text
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Text label
      ctx.fillStyle = "#10b981";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(designation, bx + badgeW / 2, by + badgeH / 2 + 0.5);
      ctx.restore();
    }

    const seqNum = String(i + 1).padStart(padLength, "0");
    const name = designation
      ? `${designation}.${extension}`
      : namingStyle === "grid"
      ? `slice-r${r + 1}-c${c + 1}.${extension}`
      : `slice-${seqNum}.${extension}`;

    const url = canvas.toDataURL(format);
    out.push({ name, url, designation: designation || undefined });
  }

    return out;
  } catch (err) {
    console.error("sliceImage error:", err);
    return [];
  }
}

export interface AutoDetectBordersResult {
  outerMargin: number;
  sliceLineThickness: number;
}

/**
 * Analyzes the image to automatically detect perimeter outer margin (F-Trim)
 * and internal cut line gutter thickness (Gap).
 */
export async function autoDetectBorders(
  imageSrc: string,
  rowCuts: number[] = [],
  colCuts: number[] = []
): Promise<AutoDetectBordersResult> {
  if (!imageSrc) return { outerMargin: 0, sliceLineThickness: 0 };
  try {
    const image = await loadImage(imageSrc);
    const w = image.naturalWidth;
    const h = image.naturalHeight;

  if (w <= 0 || h <= 0) {
    return { outerMargin: 0, sliceLineThickness: 0 };
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { outerMargin: 0, sliceLineThickness: 0 };

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const getPixel = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3],
    };
  };

  // Sample outer corners to gauge background color
  const sampleX1 = Math.min(2, w - 1);
  const sampleY1 = Math.min(2, h - 1);
  const sampleX2 = Math.max(0, w - 3);
  const sampleY2 = Math.max(0, h - 3);

  const corners = [
    getPixel(sampleX1, sampleY1),
    getPixel(sampleX2, sampleY1),
    getPixel(sampleX1, sampleY2),
    getPixel(sampleX2, sampleY2),
  ];

  const avgBgR = corners.reduce((s, c) => s + c.r, 0) / 4;
  const avgBgG = corners.reduce((s, c) => s + c.g, 0) / 4;
  const avgBgB = corners.reduce((s, c) => s + c.b, 0) / 4;

  const isColorMatch = (x: number, y: number, tol = 30) => {
    const p = getPixel(x, y);
    return (
      Math.abs(p.r - avgBgR) <= tol &&
      Math.abs(p.g - avgBgG) <= tol &&
      Math.abs(p.b - avgBgB) <= tol
    );
  };

  const isRowUniformBorder = (y: number) => {
    let matchCount = 0;
    const sampleStep = Math.max(1, Math.floor(w / 60));
    let totalSamples = 0;
    for (let x = 0; x < w; x += sampleStep) {
      totalSamples++;
      if (isColorMatch(x, y)) matchCount++;
    }
    return matchCount / totalSamples >= 0.85;
  };

  const isColUniformBorder = (x: number) => {
    let matchCount = 0;
    const sampleStep = Math.max(1, Math.floor(h / 60));
    let totalSamples = 0;
    for (let y = 0; y < h; y += sampleStep) {
      totalSamples++;
      if (isColorMatch(x, y)) matchCount++;
    }
    return matchCount / totalSamples >= 0.85;
  };

  // 1. Detect Outer Margin (F-Trim)
  let topMargin = 0;
  const maxSearchH = Math.min(Math.floor(h * 0.25), 250);
  for (let y = 0; y < maxSearchH; y++) {
    if (isRowUniformBorder(y)) {
      topMargin = y + 1;
    } else {
      break;
    }
  }

  let bottomMargin = 0;
  for (let y = h - 1; y >= h - maxSearchH; y--) {
    if (isRowUniformBorder(y)) {
      bottomMargin = h - y;
    } else {
      break;
    }
  }

  let leftMargin = 0;
  const maxSearchW = Math.min(Math.floor(w * 0.25), 250);
  for (let x = 0; x < maxSearchW; x++) {
    if (isColUniformBorder(x)) {
      leftMargin = x + 1;
    } else {
      break;
    }
  }

  let rightMargin = 0;
  for (let x = w - 1; x >= w - maxSearchW; x--) {
    if (isColUniformBorder(x)) {
      rightMargin = w - x;
    } else {
      break;
    }
  }

  const margins = [topMargin, bottomMargin, leftMargin, rightMargin].filter((m) => m > 0);
  let detectedOuterMargin = 0;
  if (margins.length > 0) {
    margins.sort((a, b) => a - b);
    detectedOuterMargin = margins[Math.floor(margins.length / 2)];
  }

  // 2. Detect Gutter / Cut Gap
  const gapThicknesses: number[] = [];

  const checkHorizontalGutterWidth = (yCenter: number) => {
    let yStart = yCenter;
    let yEnd = yCenter;
    const searchRange = Math.min(100, Math.floor(h * 0.15));

    while (yStart > Math.max(0, yCenter - searchRange) && isRowUniformBorder(yStart)) {
      yStart--;
    }
    while (yEnd < Math.min(h - 1, yCenter + searchRange) && isRowUniformBorder(yEnd)) {
      yEnd++;
    }

    const thickness = yEnd - yStart - 1;
    if (thickness >= 2 && thickness < 180) {
      gapThicknesses.push(thickness);
    }
  };

  const checkVerticalGutterWidth = (xCenter: number) => {
    let xStart = xCenter;
    let xEnd = xCenter;
    const searchRange = Math.min(100, Math.floor(w * 0.15));

    while (xStart > Math.max(0, xCenter - searchRange) && isColUniformBorder(xStart)) {
      xStart--;
    }
    while (xEnd < Math.min(w - 1, xCenter + searchRange) && isColUniformBorder(xEnd)) {
      xEnd++;
    }

    const thickness = xEnd - xStart - 1;
    if (thickness >= 2 && thickness < 180) {
      gapThicknesses.push(thickness);
    }
  };

  if (rowCuts.length > 0) {
    for (const rCut of rowCuts) {
      checkHorizontalGutterWidth(rCut);
    }
  }

  if (colCuts.length > 0) {
    for (const cCut of colCuts) {
      checkVerticalGutterWidth(cCut);
    }
  }

  if (gapThicknesses.length === 0) {
    [0.2, 0.33, 0.5, 0.66, 0.8].forEach((pct) => {
      const y = Math.floor(h * pct);
      if (isRowUniformBorder(y)) {
        checkHorizontalGutterWidth(y);
      }
    });

    [0.2, 0.33, 0.5, 0.66, 0.8].forEach((pct) => {
      const x = Math.floor(w * pct);
      if (isColUniformBorder(x)) {
        checkVerticalGutterWidth(x);
      }
    });
  }

  let detectedGap = 0;
  if (gapThicknesses.length > 0) {
    gapThicknesses.sort((a, b) => a - b);
    detectedGap = gapThicknesses[Math.floor(gapThicknesses.length / 2)];
  }

  return {
    outerMargin: Math.min(200, Math.max(0, Math.round(detectedOuterMargin))),
    sliceLineThickness: Math.min(200, Math.max(0, Math.round(detectedGap))),
  };
  } catch (err) {
    console.error("autoDetectBorders error:", err);
    return { outerMargin: 0, sliceLineThickness: 0 };
  }
}

export interface Vertex {
  x: number; // percentage of original image width (0-100)
  y: number; // percentage of original image height (0-100)
}

export interface PolygonCut {
  id: string;
  name: string;
  vertices: Vertex[];
}

/**
 * Slices an image using custom coordinate polygons.
 * Performs canvas clipping masks (ctx.clip()) within the calculated bounding boxes.
 */
export async function sliceImagePolygons(
  imageSrc: string,
  polygons: PolygonCut[],
  format: "image/png" | "image/jpeg" = "image/png"
): Promise<{ name: string; url: string }[]> {
  if (!imageSrc || !polygons || polygons.length === 0) return [];
  try {
    const image = await loadImage(imageSrc);
    const w = image.naturalWidth;
    const h = image.naturalHeight;

    if (w <= 0 || h <= 0) return [];

    const out: { name: string; url: string }[] = [];

    for (let i = 0; i < polygons.length; i++) {
      const poly = polygons[i];
      if (!poly.vertices || poly.vertices.length < 3) continue;

      // Calculate bounding box in pixel coordinate space
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;

      const pxVertices = poly.vertices.map((v) => {
        const xVal = (v.x / 100) * w;
        const yVal = (v.y / 100) * h;
        if (xVal < minX) minX = xVal;
        if (xVal > maxX) maxX = xVal;
        if (yVal < minY) minY = yVal;
        if (yVal > maxY) maxY = yVal;
        return { x: xVal, y: yVal };
      });

      // Clamp coordinates to image limits
      minX = Math.max(0, Math.floor(minX));
      maxX = Math.min(w, Math.ceil(maxX));
      minY = Math.max(0, Math.floor(minY));
      maxY = Math.min(h, Math.ceil(maxY));

      const polyW = Math.max(1, maxX - minX);
      const polyH = Math.max(1, maxY - minY);

      // Create cropped off-screen canvas matching the bounding box
      const canvas = document.createElement("canvas");
      canvas.width = polyW;
      canvas.height = polyH;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      // Draw custom-shaped clipping mask relative to bounding box
      ctx.beginPath();
      const startPt = pxVertices[0];
      ctx.moveTo(startPt.x - minX, startPt.y - minY);
      for (let j = 1; j < pxVertices.length; j++) {
        ctx.lineTo(pxVertices[j].x - minX, pxVertices[j].y - minY);
      }
      ctx.closePath();
      ctx.clip();

      // Draw full image shifted to fit the bounding box offset
      ctx.drawImage(image, -minX, -minY, w, h);

      const url = canvas.toDataURL(format);
      out.push({
        name: poly.name || `Polygon Slice ${i + 1}`,
        url,
      });
    }

    return out;
  } catch (err) {
    console.error("sliceImagePolygons error:", err);
    return [];
  }
}

export interface SpriteDetectionOptions {
  alphaThreshold?: number; // 1-255, default 15
  backgroundMode?: "auto" | "alpha" | "color"; // default "auto"
  backgroundColor?: { r: number; g: number; b: number };
  colorTolerance?: number; // 0-100, default 20
  minWidth?: number; // default 8
  minHeight?: number; // default 8
  minArea?: number; // default 32
  padding?: number; // extra padding around detected sprite box (default 0)
  mergeDistance?: number; // proximity merging in pixels (default 4)
  sortOrder?: "reading" | "left-to-right" | "top-to-bottom" | "area-desc"; // default "reading"
}

export interface DetectedSpriteBox {
  id: string;
  x: number; // pixel X in natural image
  y: number; // pixel Y in natural image
  width: number; // pixel width
  height: number; // pixel height
  percentX: number; // 0-100%
  percentY: number; // 0-100%
  percentWidth: number; // 0-100%
  percentHeight: number; // 0-100%
  pixelCount: number;
}

/**
 * Optical Transparency & Edge Detection:
 * Automatically detects individual sprites / character bounding boxes on transparent
 * or solid-color backgrounds using connected component labeling and smart alpha thresholding.
 */
export async function detectSpriteBoundingBoxes(
  imageSrc: string,
  options?: SpriteDetectionOptions
): Promise<DetectedSpriteBox[]> {
  if (!imageSrc) return [];
  try {
    const image = await loadImage(imageSrc);
    const w = image.naturalWidth;
    const h = image.naturalHeight;

    if (w <= 0 || h <= 0) return [];

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const alphaThreshold = Math.max(1, Math.min(255, options?.alphaThreshold ?? 15));
    const backgroundMode = options?.backgroundMode || "auto";
    const colorTolerance = Math.max(0, Math.min(255, options?.colorTolerance ?? 25));
    const minWidth = Math.max(1, options?.minWidth ?? 8);
    const minHeight = Math.max(1, options?.minHeight ?? 8);
    const minArea = Math.max(1, options?.minArea ?? 32);
    const padding = Math.max(0, options?.padding ?? 0);
    const mergeDistance = Math.max(0, options?.mergeDistance ?? 4);
    const sortOrder = options?.sortOrder || "reading";

    // 1. Determine background type if auto
    let isColorBg = backgroundMode === "color";
    let bgR = options?.backgroundColor?.r ?? 0;
    let bgG = options?.backgroundColor?.g ?? 0;
    let bgB = options?.backgroundColor?.b ?? 0;

    if (backgroundMode === "auto") {
      // Check if image has transparent pixels
      let hasTransparency = false;
      const step = Math.max(1, Math.floor((w * h) / 1000));
      for (let i = 3; i < data.length; i += step * 4) {
        if (data[i] < 240) {
          hasTransparency = true;
          break;
        }
      }

      if (!hasTransparency) {
        // Sample corners to detect solid background color
        const cornerIdxs = [
          0,
          (w - 1) * 4,
          ((h - 1) * w) * 4,
          ((h - 1) * w + (w - 1)) * 4,
        ];
        const rList = cornerIdxs.map((idx) => data[idx]);
        const gList = cornerIdxs.map((idx) => data[idx + 1]);
        const bList = cornerIdxs.map((idx) => data[idx + 2]);

        const avgR = rList.reduce((a, b) => a + b, 0) / 4;
        const avgG = gList.reduce((a, b) => a + b, 0) / 4;
        const avgB = bList.reduce((a, b) => a + b, 0) / 4;

        const maxDiff = Math.max(
          ...cornerIdxs.map((idx) =>
            Math.max(
              Math.abs(data[idx] - avgR),
              Math.abs(data[idx + 1] - avgG),
              Math.abs(data[idx + 2] - avgB)
            )
          )
        );

        if (maxDiff < 30) {
          isColorBg = true;
          bgR = Math.round(avgR);
          bgG = Math.round(avgG);
          bgB = Math.round(avgB);
        }
      }
    }

    // 2. Build 1D binary foreground mask
    const totalPixels = w * h;
    const isForeground = new Uint8Array(totalPixels);

    if (isColorBg) {
      for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
        const a = data[p + 3];
        if (a < alphaThreshold) continue;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const diff = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));
        if (diff > colorTolerance) {
          isForeground[i] = 1;
        }
      }
    } else {
      for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
        if (data[p + 3] >= alphaThreshold) {
          isForeground[i] = 1;
        }
      }
    }

    // 3. Fast Connected Component Labeling via Breadth-First Flood Fill
    const visited = new Uint8Array(totalPixels);
    const rawBoxes: Array<{
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
      pixelCount: number;
    }> = [];

    // Preallocate reusable BFS queue
    const queue = new Int32Array(Math.min(totalPixels, 1000000));

    for (let y = 0; y < h; y++) {
      const rowOffset = y * w;
      for (let x = 0; x < w; x++) {
        const idx = rowOffset + x;
        if (!isForeground[idx] || visited[idx]) continue;

        visited[idx] = 1;
        let qHead = 0;
        let qTail = 0;
        queue[qTail++] = idx;

        let bMinX = x;
        let bMaxX = x;
        let bMinY = y;
        let bMaxY = y;
        let bPixelCount = 0;

        while (qHead < qTail) {
          const curIdx = queue[qHead++];
          bPixelCount++;
          const curX = curIdx % w;
          const curY = Math.floor(curIdx / w);

          if (curX < bMinX) bMinX = curX;
          if (curX > bMaxX) bMaxX = curX;
          if (curY < bMinY) bMinY = curY;
          if (curY > bMaxY) bMaxY = curY;

          // Check 4-connected neighbors
          // North
          if (curY > 0) {
            const nIdx = curIdx - w;
            if (isForeground[nIdx] && !visited[nIdx]) {
              visited[nIdx] = 1;
              if (qTail < queue.length) queue[qTail++] = nIdx;
            }
          }
          // South
          if (curY < h - 1) {
            const sIdx = curIdx + w;
            if (isForeground[sIdx] && !visited[sIdx]) {
              visited[sIdx] = 1;
              if (qTail < queue.length) queue[qTail++] = sIdx;
            }
          }
          // West
          if (curX > 0) {
            const wIdx = curIdx - 1;
            if (isForeground[wIdx] && !visited[wIdx]) {
              visited[wIdx] = 1;
              if (qTail < queue.length) queue[qTail++] = wIdx;
            }
          }
          // East
          if (curX < w - 1) {
            const eIdx = curIdx + 1;
            if (isForeground[eIdx] && !visited[eIdx]) {
              visited[eIdx] = 1;
              if (qTail < queue.length) queue[qTail++] = eIdx;
            }
          }
        }

        const boxW = bMaxX - bMinX + 1;
        const boxH = bMaxY - bMinY + 1;

        if (boxW >= minWidth && boxH >= minHeight && bPixelCount >= minArea) {
          rawBoxes.push({
            minX: bMinX,
            minY: bMinY,
            maxX: bMaxX,
            maxY: bMaxY,
            pixelCount: bPixelCount,
          });
        }
      }
    }

    if (rawBoxes.length === 0) return [];

    // 4. Proximity merge phase (connects adjacent floating elements belonging to the same sprite)
    let merged = rawBoxes;
    if (mergeDistance > 0) {
      let changed = true;
      while (changed) {
        changed = false;
        const nextMerged: typeof rawBoxes = [];
        const used = new Uint8Array(merged.length);

        for (let i = 0; i < merged.length; i++) {
          if (used[i]) continue;
          let cur = { ...merged[i] };
          used[i] = 1;

          for (let j = i + 1; j < merged.length; j++) {
            if (used[j]) continue;
            const target = merged[j];

            // Bounding box distance calculation
            const distX = Math.max(0, Math.max(cur.minX - target.maxX, target.minX - cur.maxX));
            const distY = Math.max(0, Math.max(cur.minY - target.maxY, target.minY - cur.maxY));

            if (distX <= mergeDistance && distY <= mergeDistance) {
              // Merge boxes
              cur.minX = Math.min(cur.minX, target.minX);
              cur.minY = Math.min(cur.minY, target.minY);
              cur.maxX = Math.max(cur.maxX, target.maxX);
              cur.maxY = Math.max(cur.maxY, target.maxY);
              cur.pixelCount += target.pixelCount;
              used[j] = 1;
              changed = true;
            }
          }
          nextMerged.push(cur);
        }
        merged = nextMerged;
      }
    }

    // 5. Apply padding & clamp to bounds
    const processedBoxes = merged
      .map((b) => {
        const minX = Math.max(0, b.minX - padding);
        const minY = Math.max(0, b.minY - padding);
        const maxX = Math.min(w - 1, b.maxX + padding);
        const maxY = Math.min(h - 1, b.maxY + padding);
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        return {
          minX,
          minY,
          maxX,
          maxY,
          width,
          height,
          pixelCount: b.pixelCount,
        };
      })
      .filter((b) => b.width >= minWidth && b.height >= minHeight);

    // 6. Sort boxes according to requested sortOrder
    if (sortOrder === "reading") {
      // Group by vertical row lines with tolerance
      processedBoxes.sort((a, b) => {
        const centerYDiff = (a.minY + a.height / 2) - (b.minY + b.height / 2);
        const avgH = (a.height + b.height) / 2;
        if (Math.abs(centerYDiff) > avgH * 0.4) {
          return a.minY - b.minY;
        }
        return a.minX - b.minX;
      });
    } else if (sortOrder === "left-to-right") {
      processedBoxes.sort((a, b) => a.minX - b.minX || a.minY - b.minY);
    } else if (sortOrder === "top-to-bottom") {
      processedBoxes.sort((a, b) => a.minY - b.minY || a.minX - b.minX);
    } else if (sortOrder === "area-desc") {
      processedBoxes.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    }

    return processedBoxes.map((b, idx) => ({
      id: `sprite_${idx + 1}_${Math.random().toString(36).substr(2, 6)}`,
      x: b.minX,
      y: b.minY,
      width: b.width,
      height: b.height,
      percentX: (b.minX / w) * 100,
      percentY: (b.minY / h) * 100,
      percentWidth: (b.width / w) * 100,
      percentHeight: (b.height / h) * 100,
      pixelCount: b.pixelCount,
    }));
  } catch (err) {
    console.error("detectSpriteBoundingBoxes error:", err);
    return [];
  }
}

export type TrimAnchor =
  | "tight"
  | "center"
  | "bottom-center"
  | "top-center"
  | "top-left"
  | "bottom-left"
  | "top-right"
  | "bottom-right";

export type TrimBackgroundMode = "auto" | "alpha" | "color" | "white" | "black" | "edges";

export interface TrimOptions {
  alphaThreshold?: number; // 1-255, default 10
  backgroundMode?: TrimBackgroundMode; // default "auto"
  backgroundColor?: { r: number; g: number; b: number }; // default {255,255,255} or auto-detected
  colorTolerance?: number; // 0-100, default 25
  padding?: number; // uniform padding around trimmed content (default 0)
  customMargins?: { top?: number; bottom?: number; left?: number; right?: number };
  anchor?: TrimAnchor; // default "tight"
  targetSize?: { width: number; height: number }; // when specified with an anchor
  preserveOriginalSize?: boolean; // if true, clears transparent margins but keeps original canvas dimensions with chosen anchor
  removeBackgroundColor?: boolean; // if true, converts detected background color to transparent alpha in output PNG
  standardizeBatchSize?: boolean; // when trimming multiple frames in batch
  format?: "image/png" | "image/jpeg";
}

export interface TrimResult {
  url: string;
  originalWidth: number;
  originalHeight: number;
  trimmedWidth: number;
  trimmedHeight: number;
  contentBounds: { x: number; y: number; width: number; height: number };
  margins: { top: number; bottom: number; left: number; right: number };
  detectedBackground?: { r: number; g: number; b: number; isAlpha: boolean; hex: string };
}

/**
 * Smart Auto-Crop & Alpha Trimming:
 * Automatically strips excess transparent padding or solid background margins around sliced frames
 * while maintaining anchor / pivot alignment (e.g. Tight, Center, Bottom-Center for 2D character sprites, etc.).
 */
export async function trimAlphaPadding(
  imageSrc: string,
  options?: TrimOptions
): Promise<TrimResult> {
  if (!imageSrc) {
    return {
      url: imageSrc,
      originalWidth: 0,
      originalHeight: 0,
      trimmedWidth: 0,
      trimmedHeight: 0,
      contentBounds: { x: 0, y: 0, width: 0, height: 0 },
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    };
  }

  try {
    const image = await loadImage(imageSrc);
    const origW = image.naturalWidth;
    const origH = image.naturalHeight;

    if (origW <= 0 || origH <= 0) {
      return {
        url: imageSrc,
        originalWidth: origW,
        originalHeight: origH,
        trimmedWidth: origW,
        trimmedHeight: origH,
        contentBounds: { x: 0, y: 0, width: origW, height: origH },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      };
    }

    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = origW;
    srcCanvas.height = origH;
    const srcCtx = srcCanvas.getContext("2d");
    if (!srcCtx) throw new Error("Could not create canvas context");

    srcCtx.drawImage(image, 0, 0);
    const imgData = srcCtx.getImageData(0, 0, origW, origH);
    const data = imgData.data;

    const alphaThreshold = Math.max(1, Math.min(255, options?.alphaThreshold ?? 10));
    const backgroundMode = options?.backgroundMode || "auto";
    const colorTolerance = Math.max(0, Math.min(255, options?.colorTolerance ?? 25));
    const padding = Math.max(0, options?.padding ?? 0);
    const anchor = options?.anchor || "tight";
    const format = options?.format || "image/png";
    const removeBackgroundColor = options?.removeBackgroundColor ?? (backgroundMode === "color" || backgroundMode === "white" || backgroundMode === "black");

    let isColorBg = backgroundMode === "color" || backgroundMode === "white" || backgroundMode === "black" || backgroundMode === "edges";
    let bgR = 255;
    let bgG = 255;
    let bgB = 255;

    if (backgroundMode === "white") {
      bgR = 255; bgG = 255; bgB = 255;
    } else if (backgroundMode === "black") {
      bgR = 0; bgG = 0; bgB = 0;
    } else if (options?.backgroundColor) {
      bgR = options.backgroundColor.r;
      bgG = options.backgroundColor.g;
      bgB = options.backgroundColor.b;
    }

    // 1. Analyze background type if "auto" or "edges"
    let detectedIsAlpha = false;

    if (backgroundMode === "auto" || backgroundMode === "edges") {
      // Check for presence of transparent pixels (< alphaThreshold)
      let transparentSampleCount = 0;
      const totalSamples = Math.min(1000, Math.floor((origW * origH) / 4));
      const step = Math.max(1, Math.floor((origW * origH) / totalSamples));

      for (let i = 3; i < data.length; i += step * 4) {
        if (data[i] < alphaThreshold + 10) {
          transparentSampleCount++;
        }
      }

      if (transparentSampleCount > 10 && backgroundMode !== "edges") {
        detectedIsAlpha = true;
        isColorBg = false;
      } else {
        // Sample perimeter edge pixels along all 4 borders to find dominant border color
        const borderPixels: Array<{ r: number; g: number; b: number }> = [];

        // Top & Bottom edges
        const xStep = Math.max(1, Math.floor(origW / 50));
        for (let x = 0; x < origW; x += xStep) {
          const topIdx = x * 4;
          const botIdx = ((origH - 1) * origW + x) * 4;
          if (data[topIdx + 3] >= alphaThreshold) {
            borderPixels.push({ r: data[topIdx], g: data[topIdx + 1], b: data[topIdx + 2] });
          }
          if (data[botIdx + 3] >= alphaThreshold) {
            borderPixels.push({ r: data[botIdx], g: data[botIdx + 1], b: data[botIdx + 2] });
          }
        }

        // Left & Right edges
        const yStep = Math.max(1, Math.floor(origH / 50));
        for (let y = 0; y < origH; y += yStep) {
          const leftIdx = (y * origW) * 4;
          const rightIdx = (y * origW + (origW - 1)) * 4;
          if (data[leftIdx + 3] >= alphaThreshold) {
            borderPixels.push({ r: data[leftIdx], g: data[leftIdx + 1], b: data[leftIdx + 2] });
          }
          if (data[rightIdx + 3] >= alphaThreshold) {
            borderPixels.push({ r: data[rightIdx], g: data[rightIdx + 1], b: data[rightIdx + 2] });
          }
        }

        if (borderPixels.length > 0) {
          // Find cluster / mode of border colors
          const sumR = borderPixels.reduce((s, p) => s + p.r, 0);
          const sumG = borderPixels.reduce((s, p) => s + p.g, 0);
          const sumB = borderPixels.reduce((s, p) => s + p.b, 0);
          bgR = Math.round(sumR / borderPixels.length);
          bgG = Math.round(sumG / borderPixels.length);
          bgB = Math.round(sumB / borderPixels.length);
          isColorBg = true;
        } else {
          detectedIsAlpha = true;
          isColorBg = false;
        }
      }
    }

    const rgbToHex = (r: number, g: number, b: number) =>
      "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

    const detectedBackground = {
      r: bgR,
      g: bgG,
      b: bgB,
      isAlpha: detectedIsAlpha,
      hex: rgbToHex(bgR, bgG, bgB),
    };

    const isPixelBackground = (idx: number): boolean => {
      const a = data[idx + 3];
      if (a < alphaThreshold) return true;
      if (isColorBg) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const diff = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));
        return diff <= colorTolerance;
      }
      return false;
    };

    // 2. Scan bounding box of non-background content
    let minX = origW;
    let minY = origH;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < origH; y++) {
      const rowOffset = y * origW * 4;
      for (let x = 0; x < origW; x++) {
        const idx = rowOffset + x * 4;
        if (!isPixelBackground(idx)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Completely empty / uniform frame fallback
    if (maxX === -1 || maxY === -1) {
      return {
        url: imageSrc,
        originalWidth: origW,
        originalHeight: origH,
        trimmedWidth: origW,
        trimmedHeight: origH,
        contentBounds: { x: 0, y: 0, width: origW, height: origH },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        detectedBackground,
      };
    }

    // Apply custom margin offsets if provided
    if (options?.customMargins) {
      const { top = 0, bottom = 0, left = 0, right = 0 } = options.customMargins;
      minX = Math.max(0, minX - left);
      maxX = Math.min(origW - 1, maxX + right);
      minY = Math.max(0, minY - top);
      maxY = Math.min(origH - 1, maxY + bottom);
    }

    const contentW = Math.max(1, maxX - minX + 1);
    const contentH = Math.max(1, maxY - minY + 1);

    const margins = {
      top: minY,
      bottom: origH - 1 - maxY,
      left: minX,
      right: origW - 1 - maxX,
    };

    // 3. Determine target canvas dimensions and anchor positioning
    let finalW: number;
    let finalH: number;
    let dstX = 0;
    let dstY = 0;

    if (options?.preserveOriginalSize) {
      finalW = origW;
      finalH = origH;
    } else if (options?.targetSize) {
      finalW = Math.max(contentW + padding * 2, options.targetSize.width);
      finalH = Math.max(contentH + padding * 2, options.targetSize.height);
    } else if (anchor === "tight") {
      finalW = contentW + padding * 2;
      finalH = contentH + padding * 2;
      dstX = padding;
      dstY = padding;
    } else {
      // Anchored canvas: provides structured padding room for pivot positioning
      finalW = contentW + padding * 2;
      finalH = contentH + padding * 2;
    }

    if (anchor !== "tight") {
      let alignX: "left" | "center" | "right" = "center";
      let alignY: "top" | "center" | "bottom" = "center";

      if (anchor === "bottom-center") {
        alignX = "center";
        alignY = "bottom";
      } else if (anchor === "top-center") {
        alignX = "center";
        alignY = "top";
      } else if (anchor === "top-left") {
        alignX = "left";
        alignY = "top";
      } else if (anchor === "bottom-left") {
        alignX = "left";
        alignY = "bottom";
      } else if (anchor === "top-right") {
        alignX = "right";
        alignY = "top";
      } else if (anchor === "bottom-right") {
        alignX = "right";
        alignY = "bottom";
      } else if (anchor === "center") {
        alignX = "center";
        alignY = "center";
      }

      if (alignX === "left") {
        dstX = padding;
      } else if (alignX === "right") {
        dstX = finalW - padding - contentW;
      } else {
        dstX = Math.round((finalW - contentW) / 2);
      }

      if (alignY === "top") {
        dstY = padding;
      } else if (alignY === "bottom") {
        dstY = finalH - padding - contentH;
      } else {
        dstY = Math.round((finalH - contentH) / 2);
      }
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.width = Math.max(1, finalW);
    outCanvas.height = Math.max(1, finalH);
    const outCtx = outCanvas.getContext("2d");
    if (!outCtx) throw new Error("Could not create destination canvas context");

    // 4. Render cropped content, optionally keying out background color to transparency
    if (isColorBg && removeBackgroundColor && format === "image/png") {
      // Create cropped image data with keyed-out transparent background
      const croppedData = srcCtx.getImageData(minX, minY, contentW, contentH);
      const cPixels = croppedData.data;

      for (let i = 0; i < cPixels.length; i += 4) {
        const a = cPixels[i + 3];
        if (a < alphaThreshold) {
          cPixels[i + 3] = 0;
          continue;
        }
        const r = cPixels[i];
        const g = cPixels[i + 1];
        const b = cPixels[i + 2];
        const diff = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));
        if (diff <= colorTolerance) {
          // Soft alpha edge feathering for smooth transparent cutout
          const featherRange = Math.max(3, Math.round(colorTolerance * 0.4));
          if (diff <= colorTolerance - featherRange) {
            cPixels[i + 3] = 0;
          } else {
            const edgeRatio = (diff - (colorTolerance - featherRange)) / featherRange;
            cPixels[i + 3] = Math.round(a * Math.min(1, Math.max(0, edgeRatio)));
          }
        }
      }

      // Put keyed image data onto a temporary offscreen canvas to allow drawImage with offset
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = contentW;
      tempCanvas.height = contentH;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.putImageData(croppedData, 0, 0);
        outCtx.drawImage(tempCanvas, dstX, dstY);
      }
    } else {
      outCtx.drawImage(
        image,
        minX,
        minY,
        contentW,
        contentH,
        dstX,
        dstY,
        contentW,
        contentH
      );
    }

    const outUrl = outCanvas.toDataURL(format);

    return {
      url: outUrl,
      originalWidth: origW,
      originalHeight: origH,
      trimmedWidth: finalW,
      trimmedHeight: finalH,
      contentBounds: { x: minX, y: minY, width: contentW, height: contentH },
      margins,
      detectedBackground,
    };
  } catch (err) {
    console.error("trimAlphaPadding error:", err);
    return {
      url: imageSrc,
      originalWidth: 0,
      originalHeight: 0,
      trimmedWidth: 0,
      trimmedHeight: 0,
      contentBounds: { x: 0, y: 0, width: 0, height: 0 },
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    };
  }
}

/**
 * Batch trims an array of target items, optionally standardizing all frame dimensions
 * for 2D character sprite animation alignment.
 */
export async function batchTrimAlphaPadding(
  items: Array<{ id: string; url: string }>,
  options?: TrimOptions
): Promise<Array<{ id: string; url: string; result: TrimResult }>> {
  if (!items || items.length === 0) return [];

  // Pass 1: If standardizeBatchSize is requested, calculate max bounding box
  let batchTargetSize: { width: number; height: number } | undefined = options?.targetSize;

  if (options?.standardizeBatchSize && items.length > 1 && !options?.preserveOriginalSize) {
    let maxContentW = 0;
    let maxContentH = 0;

    for (const item of items) {
      try {
        const tempRes = await trimAlphaPadding(item.url, {
          ...options,
          anchor: "tight",
          padding: 0,
          targetSize: undefined,
          preserveOriginalSize: false,
        });
        if (tempRes.contentBounds.width > maxContentW) maxContentW = tempRes.contentBounds.width;
        if (tempRes.contentBounds.height > maxContentH) maxContentH = tempRes.contentBounds.height;
      } catch (e) {
        console.warn("Batch pass 1 error for item", item.id, e);
      }
    }

    const padding = options?.padding ?? 0;
    if (maxContentW > 0 && maxContentH > 0) {
      batchTargetSize = {
        width: maxContentW + padding * 2,
        height: maxContentH + padding * 2,
      };
    }
  }

  // Pass 2: Execute trim on all items
  const results: Array<{ id: string; url: string; result: TrimResult }> = [];

  for (const item of items) {
    const res = await trimAlphaPadding(item.url, {
      ...options,
      targetSize: batchTargetSize || options?.targetSize,
    });
    results.push({
      id: item.id,
      url: res.url,
      result: res,
    });
  }

  return results;
}
