/**
 * Image optimization utilities for Firestore and client-side storage.
 * Compresses oversized base64 images so they never exceed Firestore's 1MB document limit.
 */

export async function optimizeImageForFirestore(
  dataUrl: string,
  maxDim: number = 1400,
  quality: number = 0.88
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== "string") {
    return dataUrl;
  }

  // If not a data URL or already lightweight (< 600 KB), return as is
  if (!dataUrl.startsWith("data:image/") || dataUrl.length < 600000) {
    return dataUrl;
  }

  // Server-side fallback (if executed in Node/SSR environment)
  if (typeof window === "undefined" || typeof document === "undefined") {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for high quality at small file size
        let optimized = canvas.toDataURL("image/webp", quality);

        // If WebP is still over 800 KB, compress to JPEG
        if (optimized.length > 800000) {
          optimized = canvas.toDataURL("image/jpeg", 0.82);
        }

        // If still over 800 KB, reduce dimensions further
        if (optimized.length > 800000) {
          const smallCanvas = document.createElement("canvas");
          smallCanvas.width = Math.round(width * 0.75);
          smallCanvas.height = Math.round(height * 0.75);
          const sCtx = smallCanvas.getContext("2d");
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            optimized = smallCanvas.toDataURL("image/jpeg", 0.78);
          }
        }

        resolve(optimized);
      } catch (err) {
        console.warn("Image optimization fallback:", err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
