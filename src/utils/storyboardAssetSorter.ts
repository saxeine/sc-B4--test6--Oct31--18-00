/**
 * Automated sorting and grouping utilities for the Storyboard Asset Organizer.
 * Groups and sorts imported image frames by aspect ratio and dominant color.
 */

export type AspectCategory = "panoramic" | "landscape" | "square" | "portrait" | "vertical";

export type ColorFamily =
  | "Red"
  | "Orange"
  | "Yellow / Amber"
  | "Green / Emerald"
  | "Cyan / Teal"
  | "Blue / Indigo"
  | "Purple / Violet"
  | "Pink / Rose"
  | "Neutral White"
  | "Neutral Gray"
  | "Neutral Black";

export type ColorTemperature = "warm" | "cool" | "neutral";

export interface SliceAssetMetadata {
  url: string;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  aspectCategory: AspectCategory;
  aspectLabel: string;
  ratioBadge: string;
  dominantColorHex: string;
  dominantColorRgb: [number, number, number];
  dominantColorHsl: [number, number, number]; // [0..360, 0..100, 0..100]
  colorFamily: ColorFamily;
  colorName: string;
  colorTemperature: ColorTemperature;
  analyzedAt: number;
}

export type SortMode =
  | "none"
  | "aspect-shape"
  | "aspect-wide-tall"
  | "aspect-tall-wide"
  | "color-rainbow"
  | "color-family"
  | "color-warm-cool"
  | "color-light-dark"
  | "color-dark-light";

export type GroupMode = "none" | "aspect-category" | "color-family" | "color-temperature";

export interface SlicesGroup<T> {
  id: string;
  title: string;
  count: number;
  badge?: string;
  colorSwatch?: string;
  items: T[];
}

// In-memory cache for fast reuse across re-renders and modal toggles
const sliceMetadataCache = new Map<string, SliceAssetMetadata>();
const pendingAnalysisPromises = new Map<string, Promise<SliceAssetMetadata>>();

/**
 * Categorizes numerical aspect ratio into human-friendly groups
 */
export function categorizeAspectRatio(ratio: number): {
  category: AspectCategory;
  label: string;
  badge: string;
} {
  // Common standard ratios with small tolerance
  if (ratio >= 2.0) {
    return {
      category: "panoramic",
      label: "Panoramic / Ultrawide",
      badge: ratio >= 2.3 ? "21:9" : `${ratio.toFixed(1)}:1`,
    };
  }
  if (ratio >= 1.2) {
    const is16_9 = Math.abs(ratio - 16 / 9) < 0.08;
    const is4_3 = Math.abs(ratio - 4 / 3) < 0.08;
    const is3_2 = Math.abs(ratio - 1.5) < 0.06;
    return {
      category: "landscape",
      label: "Landscape (Wide)",
      badge: is16_9 ? "16:9" : is4_3 ? "4:3" : is3_2 ? "3:2" : `${ratio.toFixed(1)}:1`,
    };
  }
  if (ratio >= 0.85) {
    return {
      category: "square",
      label: "Square (1:1)",
      badge: "1:1",
    };
  }
  if (ratio >= 0.5) {
    const is9_16 = Math.abs(ratio - 9 / 16) < 0.08;
    const is3_4 = Math.abs(ratio - 3 / 4) < 0.08;
    const is2_3 = Math.abs(ratio - 2 / 3) < 0.06;
    return {
      category: "portrait",
      label: "Portrait (Tall)",
      badge: is3_4 ? "3:4" : is2_3 ? "2:3" : is9_16 ? "9:16" : `1:${(1 / ratio).toFixed(1)}`,
    };
  }
  return {
    category: "vertical",
    label: "Vertical Banner / Strip",
    badge: `1:${(1 / ratio).toFixed(1)}`,
  };
}

/**
 * Converts RGB [0..255] to HSL [0..360, 0..100, 0..100]
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Determines color family, temperature, and human-readable name from HSL
 */
export function describeHslColor(
  h: number,
  s: number,
  l: number
): {
  family: ColorFamily;
  temperature: ColorTemperature;
  name: string;
} {
  // Low luminance -> Black / Dark tones
  if (l <= 14) {
    return { family: "Neutral Black", temperature: "neutral", name: "Deep Charcoal" };
  }
  // High luminance with low saturation -> White / Light tones
  if (l >= 86 && s <= 25) {
    return { family: "Neutral White", temperature: "neutral", name: "Alabaster White" };
  }
  // Low saturation -> Gray / Monochrome
  if (s <= 14) {
    if (l > 60) return { family: "Neutral Gray", temperature: "neutral", name: "Silver Gray" };
    return { family: "Neutral Gray", temperature: "neutral", name: "Slate Gray" };
  }

  // Chromatic hues
  if (h >= 345 || h < 15) {
    return { family: "Red", temperature: "warm", name: l > 65 ? "Coral Rose" : "Crimson Red" };
  }
  if (h >= 15 && h < 45) {
    return { family: "Orange", temperature: "warm", name: l > 65 ? "Peach Orange" : "Tangerine" };
  }
  if (h >= 45 && h < 70) {
    return { family: "Yellow / Amber", temperature: "warm", name: l > 60 ? "Golden Amber" : "Mustard Gold" };
  }
  if (h >= 70 && h < 165) {
    return { family: "Green / Emerald", temperature: "cool", name: l > 60 ? "Mint Green" : "Emerald Green" };
  }
  if (h >= 165 && h < 200) {
    return { family: "Cyan / Teal", temperature: "cool", name: "Cyan Teal" };
  }
  if (h >= 200 && h < 260) {
    return { family: "Blue / Indigo", temperature: "cool", name: l > 60 ? "Sky Blue" : "Cobalt Blue" };
  }
  if (h >= 260 && h < 305) {
    return { family: "Purple / Violet", temperature: "cool", name: "Deep Violet" };
  }
  return { family: "Pink / Rose", temperature: "warm", name: "Magenta Pink" };
}

/**
 * Extracts dominant color and dimensions from an image URL
 */
export async function analyzeSliceAsset(url: string): Promise<SliceAssetMetadata> {
  const cached = sliceMetadataCache.get(url);
  if (cached) return cached;

  const pending = pendingAnalysisPromises.get(url);
  if (pending) return pending;

  const promise = new Promise<SliceAssetMetadata>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const width = img.naturalWidth || img.width || 100;
      const height = img.naturalHeight || img.height || 100;
      const aspectRatio = width / (height || 1);
      const aspectInfo = categorizeAspectRatio(aspectRatio);

      // Offscreen canvas for color analysis (downsampled to 32x32 for speed)
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      let dominantRgb: [number, number, number] = [30, 41, 59]; // fallback slate

      if (ctx) {
        try {
          ctx.drawImage(img, 0, 0, 32, 32);
          const imgData = ctx.getImageData(0, 0, 32, 32).data;

          // Color buckets for quantizing and finding true visual peak
          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let count = 0;

          // Also track chromatic pixels vs neutral
          let chromaticR = 0;
          let chromaticG = 0;
          let chromaticB = 0;
          let chromaticCount = 0;

          for (let i = 0; i < imgData.length; i += 4) {
            const a = imgData[i + 3];
            if (a < 30) continue; // Skip transparency

            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];

            rSum += r;
            gSum += g;
            bSum += b;
            count++;

            // Measure saturation/chroma
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            if (max - min > 24) {
              chromaticR += r;
              chromaticG += g;
              chromaticB += b;
              chromaticCount++;
            }
          }

          if (chromaticCount > 15) {
            dominantRgb = [
              Math.round(chromaticR / chromaticCount),
              Math.round(chromaticG / chromaticCount),
              Math.round(chromaticB / chromaticCount),
            ];
          } else if (count > 0) {
            dominantRgb = [
              Math.round(rSum / count),
              Math.round(gSum / count),
              Math.round(bSum / count),
            ];
          }
        } catch {
          // If canvas taint error or other CORS issue, fallback safely
        }
      }

      const hsl = rgbToHsl(dominantRgb[0], dominantRgb[1], dominantRgb[2]);
      const hex = `#${((1 << 24) + (dominantRgb[0] << 16) + (dominantRgb[1] << 8) + dominantRgb[2])
        .toString(16)
        .slice(1)}`;

      const { family, temperature, name } = describeHslColor(hsl[0], hsl[1], hsl[2]);

      const result: SliceAssetMetadata = {
        url,
        width,
        height,
        aspectRatio,
        aspectCategory: aspectInfo.category,
        aspectLabel: aspectInfo.label,
        ratioBadge: aspectInfo.badge,
        dominantColorHex: hex,
        dominantColorRgb: dominantRgb,
        dominantColorHsl: hsl,
        colorFamily: family,
        colorName: name,
        colorTemperature: temperature,
        analyzedAt: Date.now(),
      };

      sliceMetadataCache.set(url, result);
      pendingAnalysisPromises.delete(url);
      resolve(result);
    };

    img.onerror = () => {
      // Fallback on error
      const fallback: SliceAssetMetadata = {
        url,
        width: 100,
        height: 100,
        aspectRatio: 1,
        aspectCategory: "square",
        aspectLabel: "Square (1:1)",
        ratioBadge: "1:1",
        dominantColorHex: "#334155",
        dominantColorRgb: [51, 65, 85],
        dominantColorHsl: [215, 25, 27],
        colorFamily: "Neutral Gray",
        colorName: "Slate Gray",
        colorTemperature: "neutral",
        analyzedAt: Date.now(),
      };
      sliceMetadataCache.set(url, fallback);
      pendingAnalysisPromises.delete(url);
      resolve(fallback);
    };

    img.src = url;
  });

  pendingAnalysisPromises.set(url, promise);
  return promise;
}

/**
 * Bulk pre-analyzes slices in background and updates cache
 */
export async function bulkAnalyzeSlices(urls: string[]): Promise<Map<string, SliceAssetMetadata>> {
  const map = new Map<string, SliceAssetMetadata>();
  const toFetch: string[] = [];

  for (const url of urls) {
    const cached = sliceMetadataCache.get(url);
    if (cached) {
      map.set(url, cached);
    } else {
      toFetch.push(url);
    }
  }

  if (toFetch.length > 0) {
    // Process in batches of 10 to avoid pegging browser
    const batchSize = 10;
    for (let i = 0; i < toFetch.length; i += batchSize) {
      const batch = toFetch.slice(i, i + batchSize);
      const results = await Promise.all(batch.map((url) => analyzeSliceAsset(url)));
      results.forEach((meta) => map.set(meta.url, meta));
    }
  }

  return map;
}

/**
 * Sorts slice items according to the chosen automated sort mode
 */
export function sortSlicesByMode<T extends { url: string; name?: string }>(
  items: T[],
  mode: SortMode,
  metaMap: Map<string, SliceAssetMetadata>
): T[] {
  if (mode === "none" || items.length <= 1) return [...items];

  const sorted = [...items];

  const aspectCategoryOrder: Record<AspectCategory, number> = {
    panoramic: 0,
    landscape: 1,
    square: 2,
    portrait: 3,
    vertical: 4,
  };

  const colorFamilyOrder: Record<ColorFamily, number> = {
    "Red": 0,
    "Orange": 1,
    "Yellow / Amber": 2,
    "Green / Emerald": 3,
    "Cyan / Teal": 4,
    "Blue / Indigo": 5,
    "Purple / Violet": 6,
    "Pink / Rose": 7,
    "Neutral White": 8,
    "Neutral Gray": 9,
    "Neutral Black": 10,
  };

  const getMeta = (item: T): SliceAssetMetadata => {
    return (
      metaMap.get(item.url) ||
      sliceMetadataCache.get(item.url) || {
        url: item.url,
        width: 100,
        height: 100,
        aspectRatio: 1,
        aspectCategory: "square",
        aspectLabel: "Square",
        ratioBadge: "1:1",
        dominantColorHex: "#334155",
        dominantColorRgb: [51, 65, 85],
        dominantColorHsl: [0, 0, 50],
        colorFamily: "Neutral Gray",
        colorName: "Slate",
        colorTemperature: "neutral",
        analyzedAt: 0,
      }
    );
  };

  sorted.sort((a, b) => {
    const metaA = getMeta(a);
    const metaB = getMeta(b);

    switch (mode) {
      case "aspect-shape": {
        // Group by shape category, then by descending ratio within category
        const catDiff = aspectCategoryOrder[metaA.aspectCategory] - aspectCategoryOrder[metaB.aspectCategory];
        if (catDiff !== 0) return catDiff;
        return metaB.aspectRatio - metaA.aspectRatio;
      }

      case "aspect-wide-tall": {
        // Pure descending aspect ratio: Widest panoramas down to tallest vertical strips
        return metaB.aspectRatio - metaA.aspectRatio;
      }

      case "aspect-tall-wide": {
        // Pure ascending aspect ratio: Tall vertical strips up to widest panoramas
        return metaA.aspectRatio - metaB.aspectRatio;
      }

      case "color-rainbow": {
        // Chromatic rainbow spectrum: Sort by Hue (0° to 360°), then neutrals at end sorted by lightness
        const isNeutralA = metaA.dominantColorHsl[1] <= 14 || metaA.dominantColorHsl[2] <= 14 || metaA.dominantColorHsl[2] >= 86;
        const isNeutralB = metaB.dominantColorHsl[1] <= 14 || metaB.dominantColorHsl[2] <= 14 || metaB.dominantColorHsl[2] >= 86;

        if (!isNeutralA && !isNeutralB) {
          // Both chromatic: compare Hue
          const hueDiff = metaA.dominantColorHsl[0] - metaB.dominantColorHsl[0];
          if (Math.abs(hueDiff) > 15) return hueDiff;
          // Sub-sort by saturation and lightness
          return metaB.dominantColorHsl[1] - metaA.dominantColorHsl[1];
        }

        if (!isNeutralA && isNeutralB) return -1; // Chromatic comes before neutral
        if (isNeutralA && !isNeutralB) return 1;

        // Both neutral: sort from light to dark
        return metaB.dominantColorHsl[2] - metaA.dominantColorHsl[2];
      }

      case "color-family": {
        // Group by distinct color families
        const famDiff = colorFamilyOrder[metaA.colorFamily] - colorFamilyOrder[metaB.colorFamily];
        if (famDiff !== 0) return famDiff;
        // Within same family, sort by lightness
        return metaB.dominantColorHsl[2] - metaA.dominantColorHsl[2];
      }

      case "color-warm-cool": {
        const tempOrder = { warm: 0, cool: 1, neutral: 2 };
        const tempDiff = tempOrder[metaA.colorTemperature] - tempOrder[metaB.colorTemperature];
        if (tempDiff !== 0) return tempDiff;
        return metaA.dominantColorHsl[0] - metaB.dominantColorHsl[0];
      }

      case "color-light-dark": {
        // Lightest/brightest frames first down to darkest
        return metaB.dominantColorHsl[2] - metaA.dominantColorHsl[2];
      }

      case "color-dark-light": {
        // Darkest frames first up to brightest
        return metaA.dominantColorHsl[2] - metaB.dominantColorHsl[2];
      }

      default:
        return 0;
    }
  });

  return sorted;
}

/**
 * Groups slices into categorized sections for structured rendering
 */
export function groupSlicesByMode<T extends { url: string; name?: string }>(
  items: T[],
  groupMode: GroupMode,
  metaMap: Map<string, SliceAssetMetadata>
): SlicesGroup<T>[] {
  if (items.length === 0) return [];

  const getMeta = (item: T): SliceAssetMetadata => {
    return (
      metaMap.get(item.url) ||
      sliceMetadataCache.get(item.url) || {
        url: item.url,
        width: 100,
        height: 100,
        aspectRatio: 1,
        aspectCategory: "square",
        aspectLabel: "Square",
        ratioBadge: "1:1",
        dominantColorHex: "#334155",
        dominantColorRgb: [51, 65, 85],
        dominantColorHsl: [0, 0, 50],
        colorFamily: "Neutral Gray",
        colorName: "Slate",
        colorTemperature: "neutral",
        analyzedAt: 0,
      }
    );
  };

  if (groupMode === "aspect-category") {
    const buckets: Record<AspectCategory, T[]> = {
      panoramic: [],
      landscape: [],
      square: [],
      portrait: [],
      vertical: [],
    };

    items.forEach((item) => {
      const meta = getMeta(item);
      buckets[meta.aspectCategory].push(item);
    });

    const groups: SlicesGroup<T>[] = [];
    const categoryConfigs: Array<{ id: AspectCategory; title: string; badge: string }> = [
      { id: "square", title: "Square (1:1)", badge: "1:1" },
      { id: "landscape", title: "Landscape (Wide)", badge: "16:9 / 4:3" },
      { id: "portrait", title: "Portrait (Tall)", badge: "3:4 / 2:3" },
      { id: "panoramic", title: "Panoramic / Ultrawide", badge: ">= 2:1" },
      { id: "vertical", title: "Vertical Banner / Strip", badge: "< 1:2" },
    ];

    categoryConfigs.forEach((cfg) => {
      const bucketItems = buckets[cfg.id];
      if (bucketItems.length > 0) {
        groups.push({
          id: cfg.id,
          title: cfg.title,
          badge: cfg.badge,
          count: bucketItems.length,
          items: bucketItems,
        });
      }
    });

    return groups;
  }

  if (groupMode === "color-family") {
    const families: ColorFamily[] = [
      "Red",
      "Orange",
      "Yellow / Amber",
      "Green / Emerald",
      "Cyan / Teal",
      "Blue / Indigo",
      "Purple / Violet",
      "Pink / Rose",
      "Neutral White",
      "Neutral Gray",
      "Neutral Black",
    ];

    const familySwatch: Record<ColorFamily, string> = {
      "Red": "#ef4444",
      "Orange": "#f97316",
      "Yellow / Amber": "#eab308",
      "Green / Emerald": "#10b981",
      "Cyan / Teal": "#06b6d4",
      "Blue / Indigo": "#3b82f6",
      "Purple / Violet": "#a855f7",
      "Pink / Rose": "#ec4899",
      "Neutral White": "#f8fafc",
      "Neutral Gray": "#94a3b8",
      "Neutral Black": "#1e293b",
    };

    const buckets = new Map<ColorFamily, T[]>();
    families.forEach((f) => buckets.set(f, []));

    items.forEach((item) => {
      const meta = getMeta(item);
      const list = buckets.get(meta.colorFamily) || [];
      list.push(item);
      buckets.set(meta.colorFamily, list);
    });

    const groups: SlicesGroup<T>[] = [];
    families.forEach((f) => {
      const bucketItems = buckets.get(f) || [];
      if (bucketItems.length > 0) {
        groups.push({
          id: f,
          title: f,
          colorSwatch: familySwatch[f],
          count: bucketItems.length,
          items: bucketItems,
        });
      }
    });

    return groups;
  }

  if (groupMode === "color-temperature") {
    const temps: ColorTemperature[] = ["warm", "cool", "neutral"];
    const tempTitles: Record<ColorTemperature, string> = {
      warm: "Warm Tones (Red, Orange, Yellow, Pink)",
      cool: "Cool Tones (Green, Cyan, Blue, Violet)",
      neutral: "Neutral Tones (Black, Gray, White)",
    };
    const tempSwatches: Record<ColorTemperature, string> = {
      warm: "#f97316",
      cool: "#38bdf8",
      neutral: "#94a3b8",
    };

    const buckets: Record<ColorTemperature, T[]> = { warm: [], cool: [], neutral: [] };
    items.forEach((item) => {
      const meta = getMeta(item);
      buckets[meta.colorTemperature].push(item);
    });

    const groups: SlicesGroup<T>[] = [];
    temps.forEach((t) => {
      if (buckets[t].length > 0) {
        groups.push({
          id: t,
          title: tempTitles[t],
          colorSwatch: tempSwatches[t],
          count: buckets[t].length,
          items: buckets[t],
        });
      }
    });

    return groups;
  }

  return [
    {
      id: "all",
      title: "All Slices",
      count: items.length,
      items,
    },
  ];
}
