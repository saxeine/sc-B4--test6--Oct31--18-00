export type PresetCategory =
  | "All"
  | "Favorites"
  | "Standard"
  | "Manga / Comic"
  | "Asymmetric"
  | "Cinematic"
  | "Webtoon"
  | "Custom";

export interface CustomLayoutPreset {
  id: string;
  name: string;
  description: string;
  category: "Standard" | "Manga / Comic" | "Asymmetric" | "Cinematic" | "Webtoon" | "Custom";
  isBuiltIn?: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt?: string;

  // Grid division counts
  numRows: number;
  numCols: number;

  // Normalized relative cut positions [0..1]
  // rowRatios are horizontal cut line positions as fractions of image height (0 < r < 1)
  // colRatios are vertical cut line positions as fractions of image width (0 < c < 1)
  rowRatios: number[];
  colRatios: number[];

  // Carver slash skew angle in degrees (-20 to 20)
  carverSkew: number;

  // Optional pixel dimensions and absolute cuts at time of save
  savedImageWidth?: number;
  savedImageHeight?: number;
  rowPixelCuts?: number[];
  colPixelCuts?: number[];

  // Associated slicing styles and label settings
  styleSettings?: {
    sliceLineColor?: string;
    sliceLineStyle?: "solid" | "dashed" | "dotted";
    sliceLineThickness?: number;
    sliceLineThicknessX?: number;
    sliceLineThicknessY?: number;
    isGapLocked?: boolean;
    outerMargin?: number;
    numberingOrigin?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    numberingFlow?: "horizontal" | "vertical";
    namingStyle?: "sequential" | "grid";
    format?: "image/png" | "image/jpeg";
    showGridLabels?: boolean;
    showPixelLabels?: boolean;
    gridLabelPreset?: string;
    customGridLabelPrefix?: string;
  };
}

export const BUILTIN_LAYOUT_PRESETS: CustomLayoutPreset[] = [
  {
    id: "builtin_standard_3x3",
    name: "Standard 3×3 Grid",
    description: "Classic uniform 9-box grid for balanced storyboards, sprite sheets, and icon sets.",
    category: "Standard",
    isBuiltIn: true,
    isFavorite: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 3,
    numCols: 3,
    rowRatios: [0.3333, 0.6667],
    colRatios: [0.3333, 0.6667],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#10b981",
      sliceLineStyle: "solid",
      sliceLineThickness: 22,
      outerMargin: 17,
      numberingOrigin: "top-left",
      numberingFlow: "horizontal",
      namingStyle: "sequential",
    },
  },
  {
    id: "builtin_big_center_hero",
    name: "Big Center Hero",
    description: "Dominant central hero panel with 8 surrounding framing border tiles for impact keyframes.",
    category: "Asymmetric",
    isBuiltIn: true,
    isFavorite: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 3,
    numCols: 3,
    rowRatios: [0.2, 0.8],
    colRatios: [0.2, 0.8],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#38bdf8",
      sliceLineStyle: "solid",
      sliceLineThickness: 20,
      outerMargin: 16,
      numberingOrigin: "top-left",
      numberingFlow: "horizontal",
      namingStyle: "sequential",
    },
  },
  {
    id: "builtin_manga_slanted",
    name: "Manga Slanted Action Slash",
    description: "Dynamic angled action panels with -8° diagonal cut momentum for action manga and battle scenes.",
    category: "Manga / Comic",
    isBuiltIn: true,
    isFavorite: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 3,
    numCols: 2,
    rowRatios: [0.3, 0.68],
    colRatios: [0.5],
    carverSkew: -8,
    styleSettings: {
      sliceLineColor: "#f43f5e",
      sliceLineStyle: "solid",
      sliceLineThickness: 24,
      outerMargin: 18,
      numberingOrigin: "top-left",
      numberingFlow: "horizontal",
      namingStyle: "sequential",
    },
  },
  {
    id: "builtin_cinematic_strip",
    name: "Cinematic Letterbox Trio",
    description: "Ultra-wide widescreen hero tier framed with top and bottom anamorphic letterbox bands.",
    category: "Cinematic",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 3,
    numCols: 1,
    rowRatios: [0.15, 0.85],
    colRatios: [],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#a855f7",
      sliceLineStyle: "solid",
      sliceLineThickness: 22,
      outerMargin: 17,
    },
  },
  {
    id: "builtin_golden_ratio",
    name: "Golden Ratio (Phi 1.618)",
    description: "Harmonious Fibonacci ratio focal cuts (38.2% / 61.8%) adhering to classical divine proportions.",
    category: "Standard",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 2,
    numCols: 2,
    rowRatios: [0.382],
    colRatios: [0.618],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#fbbf24",
      sliceLineStyle: "solid",
      sliceLineThickness: 20,
      outerMargin: 16,
    },
  },
  {
    id: "builtin_overlap_stack",
    name: "Overlap Stack (Right Tier)",
    description: "Asymmetrical vertical division featuring a compact left navigation column and broad right focus panels.",
    category: "Asymmetric",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 3,
    numCols: 2,
    rowRatios: [0.3333, 0.6667],
    colRatios: [0.65],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#818cf8",
      sliceLineStyle: "solid",
      sliceLineThickness: 22,
      outerMargin: 17,
    },
  },
  {
    id: "builtin_4koma_manga",
    name: "Yon-Koma (4-Panel Manga)",
    description: "Traditional 4-panel vertical gag/narrative progression strip (Ki-shō-ten-ketsu).",
    category: "Manga / Comic",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 4,
    numCols: 1,
    rowRatios: [0.25, 0.5, 0.75],
    colRatios: [],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#f43f5e",
      sliceLineStyle: "solid",
      sliceLineThickness: 26,
      outerMargin: 20,
    },
  },
  {
    id: "builtin_webtoon_6tier",
    name: "Webtoon Scroll 6-Panel Strip",
    description: "Vertical mobile-first webtoon progression with 6 equal sequential scroll beats.",
    category: "Webtoon",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 6,
    numCols: 1,
    rowRatios: [0.1667, 0.3333, 0.5, 0.6667, 0.8333],
    colRatios: [],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#2dd4bf",
      sliceLineStyle: "solid",
      sliceLineThickness: 24,
      outerMargin: 18,
    },
  },
  {
    id: "builtin_comic_2x4",
    name: "Comic Spread 2×4 (8 Frames)",
    description: "Fast-paced 8-panel comic landscape spread with two balanced tiers across four beat columns.",
    category: "Manga / Comic",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 2,
    numCols: 4,
    rowRatios: [0.5],
    colRatios: [0.25, 0.5, 0.75],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#fb923c",
      sliceLineStyle: "solid",
      sliceLineThickness: 22,
      outerMargin: 16,
    },
  },
  {
    id: "builtin_t_split_header",
    name: "T-Split Hero Header",
    description: "Expansive top lead banner panel positioned above three supporting lower detail panels.",
    category: "Asymmetric",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 2,
    numCols: 3,
    rowRatios: [0.42],
    colRatios: [0.3333, 0.6667],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#06b6d4",
      sliceLineStyle: "solid",
      sliceLineThickness: 20,
      outerMargin: 16,
    },
  },
  {
    id: "builtin_vertical_triad",
    name: "Vertical Triptych (3-Banner)",
    description: "Three tall parallel vertical portrait banners side-by-side for character lineups and outfits.",
    category: "Standard",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 1,
    numCols: 3,
    rowRatios: [],
    colRatios: [0.3333, 0.6667],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#3b82f6",
      sliceLineStyle: "solid",
      sliceLineThickness: 22,
      outerMargin: 17,
    },
  },
  {
    id: "builtin_shonen_splash",
    name: "Shonen 5-Panel Splash",
    description: "High-voltage angled shonen manga action spread with forward +7° slash velocity.",
    category: "Manga / Comic",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 3,
    numCols: 3,
    rowRatios: [0.25, 0.72],
    colRatios: [0.38, 0.74],
    carverSkew: 7,
    styleSettings: {
      sliceLineColor: "#ec4899",
      sliceLineStyle: "solid",
      sliceLineThickness: 26,
      outerMargin: 19,
    },
  },
  {
    id: "builtin_2x2_quad",
    name: "Balanced 2×2 Quadrant",
    description: "Clean symmetrical 4-way quadrant split for comparative frames, before/afters, and asset packs.",
    category: "Standard",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 2,
    numCols: 2,
    rowRatios: [0.5],
    colRatios: [0.5],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#10b981",
      sliceLineStyle: "solid",
      sliceLineThickness: 22,
      outerMargin: 17,
    },
  },
  {
    id: "builtin_split_diptych",
    name: "Editorial 1×2 Diptych",
    description: "Side-by-side vertical split into two equal half-page panels for widescreen comparisons.",
    category: "Standard",
    isBuiltIn: true,
    createdAt: "2026-09-24T00:00:00.000Z",
    numRows: 1,
    numCols: 2,
    rowRatios: [],
    colRatios: [0.5],
    carverSkew: 0,
    styleSettings: {
      sliceLineColor: "#10b981",
      sliceLineStyle: "solid",
      sliceLineThickness: 20,
      outerMargin: 16,
    },
  },
];
