/**
 * Grid Segment Label Presets
 * Provides preset label naming and formats for canvas grid segments and slicing.
 */

export type GridLabelPreset =
  | "numeric" // 1, 2, 3...
  | "excel" // A1, B1, C1 (Column letter + Row number)
  | "comic" // Comic1, Comic2, Comic3...
  | "panel_short" // P1, P2, P3...
  | "panel_full" // Panel 1, Panel 2, Panel 3...
  | "frame_short" // F1, F2, F3...
  | "alpha" // A, B, C, D...
  | "matrix" // R1C1, R1C2, R2C1...
  | "custom"; // User-defined prefix, e.g. Shot-1, Cut-1

export interface GridLabelPresetOption {
  id: GridLabelPreset;
  name: string;
  shortTag: string;
  example: string;
  description: string;
}

export const GRID_LABEL_PRESETS: GridLabelPresetOption[] = [
  {
    id: "numeric",
    name: "Simple Numeric",
    shortTag: "1, 2...",
    example: "1, 2, 3...",
    description: "Standard sequential numbering sequence (1-N)",
  },
  {
    id: "excel",
    name: "Alpha-Numeric (Excel/Chess)",
    shortTag: "A1, B1...",
    example: "A1, B1, C1...",
    description: "Column letter with Row number (Col A/B/C + Row 1/2/3)",
  },
  {
    id: "comic",
    name: "Comic Panels",
    shortTag: "Comic1...",
    example: "Comic1, Comic2...",
    description: "Comic book panel numbering sequence (Comic1, Comic2...)",
  },
  {
    id: "panel_short",
    name: "Panel Short (P1, P2)",
    shortTag: "P1, P2...",
    example: "P1, P2, P3...",
    description: "Storyboard panel shorthand code (P1, P2, P3...)",
  },
  {
    id: "panel_full",
    name: "Panel Full",
    shortTag: "Panel 1...",
    example: "Panel 1, Panel 2...",
    description: "Full panel prefix label for production storyboard strips",
  },
  {
    id: "frame_short",
    name: "Frame Short (F1, F2)",
    shortTag: "F1, F2...",
    example: "F1, F2, F3...",
    description: "Animation & video frame shorthand (F1, F2, F3...)",
  },
  {
    id: "alpha",
    name: "Alphabetic Letters",
    shortTag: "A, B...",
    example: "A, B, C, D...",
    description: "Sequential alphabet characters (A, B, C, D...)",
  },
  {
    id: "matrix",
    name: "Row & Column Matrix",
    shortTag: "R1C1...",
    example: "R1C1, R1C2...",
    description: "Explicit 2D grid matrix coordinates (R1C1, R1C2...)",
  },
  {
    id: "custom",
    name: "Custom Prefix",
    shortTag: "Custom...",
    example: "Shot1, Shot2...",
    description: "User-defined custom prefix followed by segment number",
  },
];

/**
 * Converts a 0-based column index to Excel-style letters:
 * 0 -> A, 1 -> B, 25 -> Z, 26 -> AA, 27 -> AB...
 */
export function getColumnLetter(colIndex: number): string {
  let letter = "";
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Formats a single grid cell's display label based on the active preset
 */
export function getSegmentPresetLabel(
  preset: GridLabelPreset,
  cell: { r: number; c: number; seq: number },
  customPrefix = "Shot"
): string {
  switch (preset) {
    case "excel":
      return `${getColumnLetter(cell.c)}${cell.r + 1}`;
    case "comic":
      return `Comic${cell.seq}`;
    case "panel_short":
      return `P${cell.seq}`;
    case "panel_full":
      return `Panel ${cell.seq}`;
    case "frame_short":
      return `F${cell.seq}`;
    case "alpha":
      return getColumnLetter(cell.seq - 1);
    case "matrix":
      return `R${cell.r + 1}C${cell.c + 1}`;
    case "custom":
      return `${customPrefix}${cell.seq}`;
    case "numeric":
    default:
      return `${cell.seq}`;
  }
}
