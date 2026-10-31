import JSZip from "jszip";

export interface ProjectState {
  cutMode: "grid" | "freeform";
  slicePrefix: string;
  numRows: number;
  numCols: number;
  rowCuts: number[];
  colCuts: number[];
  carveImageSize: { width: number; height: number };
  format: "image/png" | "image/jpeg";
  numberingOrigin: string;
  numberingFlow: string;
  namingStyle: string;
  sliceLineColor: string;
  sliceLineStyle: string;
  sliceLineThickness: number;
  sliceLineThicknessX: number;
  sliceLineThicknessY: number;
  isGapLocked: boolean;
  outerMargin: number;
  showPixelLabels: boolean;
  canvasFitMode: string;
  disableBoxActions: boolean;
  multiCrops: any[];
  storyboardCellMode: string;
  storyboardLayout: string;
  slotSize: string;
  isReverseInsert: boolean;
  storyboardDropAction: string;
  splitPreviewSize: string;
  splitPreviewLayout: string;
  isSplitPreviewCollapsed: boolean;
  isSplitPreviewVisible: boolean;
  splitPreviewOrientation: string;
  splitGridCols: number;
  screenplaySlides: any[];
  activeScreenplaySlideId: string | null;
  isScreenplayOpen: boolean;

  // Dynamic panel polygon cuts
  freeformPolygons: any[];

  // Component mappings for layers and bubbles
  neo1LayersMap: Record<string, any[]>;
  bubba1BubblesMap: Record<string, any[]>;
}

// Converts a base64 Data URL to a binary Blob
export function dataURLToBlob(dataURL: string): Blob | null {
  if (!dataURL) return null;
  try {
    const arr = dataURL.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("dataURLToBlob error:", e);
    return null;
  }
}

// Converts a Blob back to a base64 Data URL
export function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Bundles the full application states and binary image assets into a single .carve ZIP file.
 */
export async function saveProjectToCarveFile(
  state: ProjectState,
  images: {
    originalImageSrc?: string;
    imageSrc?: string;
    croppedImageSrc?: string;
    storyboardSlices: { name: string; url: string }[];
    storyboardSlots: { id: number; name: string; url?: string }[];
  }
): Promise<Blob> {
  const zip = new JSZip();

  // Prepare metadata and index pointers to binary attachments
  const manifest = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    state: {
      ...state,
      storyboardSlicesMeta: images.storyboardSlices.map((s, idx) => ({ name: s.name, index: idx })),
      storyboardSlotsMeta: images.storyboardSlots.map((s, idx) => ({ id: s.id, name: s.name, hasUrl: !!s.url, index: idx })),
    },
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Store main master image assets
  if (images.originalImageSrc && images.originalImageSrc.startsWith("data:")) {
    const blob = dataURLToBlob(images.originalImageSrc);
    if (blob) zip.file("images/original_img", blob);
  }
  if (images.imageSrc && images.imageSrc.startsWith("data:")) {
    const blob = dataURLToBlob(images.imageSrc);
    if (blob) zip.file("images/image_img", blob);
  }
  if (images.croppedImageSrc && images.croppedImageSrc.startsWith("data:")) {
    const blob = dataURLToBlob(images.croppedImageSrc);
    if (blob) zip.file("images/cropped_img", blob);
  }

  // Store slices folder
  const slicesFolder = zip.folder("slices");
  if (slicesFolder) {
    for (let i = 0; i < images.storyboardSlices.length; i++) {
      const slice = images.storyboardSlices[i];
      if (slice.url.startsWith("data:")) {
        const blob = dataURLToBlob(slice.url);
        if (blob) {
          slicesFolder.file(`slice_${i}`, blob);
        }
      }
    }
  }

  // Store slots folder
  const slotsFolder = zip.folder("slots");
  if (slotsFolder) {
    for (let i = 0; i < images.storyboardSlots.length; i++) {
      const slot = images.storyboardSlots[i];
      if (slot.url && slot.url.startsWith("data:")) {
        const blob = dataURLToBlob(slot.url);
        if (blob) {
          slotsFolder.file(`slot_${i}`, blob);
        }
      }
    }
  }

  return zip.generateAsync({ type: "blob" });
}

/**
 * Loads and unpacks a .carve ZIP archive back into usable state variables and data URLs.
 */
export async function loadProjectFromCarveFile(blob: Blob): Promise<{
  state: any;
  originalImageSrc?: string;
  imageSrc?: string;
  croppedImageSrc?: string;
  storyboardSlices: { name: string; url: string }[];
  storyboardSlots: any[];
}> {
  const zip = await JSZip.loadAsync(blob);
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    throw new Error("Invalid .carve file: manifest.json not found");
  }

  const manifestText = await manifestFile.async("text");
  const manifest = JSON.parse(manifestText);
  const state = manifest.state;

  let originalImageSrc = "";
  let imageSrc = "";
  let croppedImageSrc = "";

  const originalFile = zip.file("images/original_img");
  if (originalFile) {
    const originalBlob = await originalFile.async("blob");
    originalImageSrc = await fileToDataURL(originalBlob);
  }

  const imgFile = zip.file("images/image_img");
  if (imgFile) {
    const imgBlob = await imgFile.async("blob");
    imageSrc = await fileToDataURL(imgBlob);
  }

  const croppedFile = zip.file("images/cropped_img");
  if (croppedFile) {
    const croppedBlob = await croppedFile.async("blob");
    croppedImageSrc = await fileToDataURL(croppedBlob);
  }

  // Restore slices from zip
  const storyboardSlices: { name: string; url: string }[] = [];
  const slicesMeta = state.storyboardSlicesMeta || [];
  for (const meta of slicesMeta) {
    const sliceFile = zip.file(`slices/slice_${meta.index}`);
    if (sliceFile) {
      const b = await sliceFile.async("blob");
      const url = await fileToDataURL(b);
      storyboardSlices.push({ name: meta.name, url });
    }
  }

  // Restore slots from zip
  const storyboardSlots: any[] = [];
  const slotsMeta = state.storyboardSlotsMeta || [];
  for (const meta of slotsMeta) {
    let url = "";
    if (meta.hasUrl) {
      const slotFile = zip.file(`slots/slot_${meta.index}`);
      if (slotFile) {
        const b = await slotFile.async("blob");
        url = await fileToDataURL(b);
      }
    }
    storyboardSlots.push({ id: meta.id, name: meta.name, url: url || undefined });
  }

  return {
    state,
    originalImageSrc,
    imageSrc,
    croppedImageSrc,
    storyboardSlices,
    storyboardSlots,
  };
}
