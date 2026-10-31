/**
 * Centralized User-Defined Default Image configuration and helpers.
 *
 * Ensures that the present active image is permanently user-defined and
 * persisted across resets, reloads, and code rewrites rather than falling
 * back to unexpected legacy placeholders or relying on wiped local storage.
 */

export const DEFAULT_USER_DEFINED_IMAGE_PATH = "/user_defined_default_image.png";
export const USER_DEFINED_IMAGE_KEY = "seqcarver_user_defined_master_image";
export const USER_DEFINED_API_ENDPOINT = "/api/user-defined-image";

export interface UserDefinedImageResponse {
  success: boolean;
  url?: string;
  dataUrl?: string | null;
  message?: string;
}

/**
 * Persists the user-defined master image to the backend server disk.
 * This guarantees the image survives code rewrites, server reboots,
 * and browser storage clears.
 */
export async function persistUserDefinedImageToServer(dataUrlOrUrl: string): Promise<boolean> {
  try {
    const res = await fetch(USER_DEFINED_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl: dataUrlOrUrl }),
    });
    if (!res.ok) {
      console.warn("Server user-defined image persist returned status:", res.status);
      return false;
    }
    const data: UserDefinedImageResponse = await res.json();
    return data.success;
  } catch (err) {
    console.warn("Failed to persist user-defined image to server:", err);
    return false;
  }
}

/**
 * Fetches the user-defined master image from the backend server disk.
 */
export async function fetchUserDefinedImageFromServer(): Promise<string | null> {
  try {
    const res = await fetch(USER_DEFINED_API_ENDPOINT, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    const data: UserDefinedImageResponse = await res.json();
    if (data.success && data.dataUrl) {
      return data.dataUrl;
    }
    if (data.success && data.url) {
      return data.url;
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch user-defined image from server:", err);
    return null;
  }
}
