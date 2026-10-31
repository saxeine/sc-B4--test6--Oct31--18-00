import {
  saveAppStateToDatabase,
  getAppStateFromDatabase,
  deleteAppStateFromDatabase,
} from "../services/firebase";
import { remoteStore } from "../services/remoteKeyValueStore";

/**
 * Persistence policy
 * ------------------
 * Firestore is the system of record for every value handled here.
 * IndexedDB is retained purely as an *offline binary cache* for large image
 * payloads — it is never the source of truth and never holds UI copy or layout
 * configuration. `localStorage` has been removed entirely; small values that
 * need a synchronous mirror go through `remoteStore`, which is database-backed.
 */

const DB_NAME = "SeqCarverDB";
const STORE_NAME = "appSettings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredDefaultImage(key: string = "defaultBox1Image"): Promise<string | null> {
  // 1. Try reading from Firestore Cloud Database
  try {
    const dbValue = await getAppStateFromDatabase<string>(`img_${key}`);
    if (dbValue && typeof dbValue === "string") {
      return dbValue;
    }
  } catch (err) {
    console.warn("Could not read image from cloud database, falling back to local:", err);
  }

  // 2. Local fallback
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result && typeof req.result === "string" ? req.result : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveStoredDefaultImage(key: string, dataUrl: string): Promise<boolean> {
  // 1. Primary Save: Cloud Database
  let dbSuccess = false;
  try {
    dbSuccess = await saveAppStateToDatabase(`img_${key}`, dataUrl);
  } catch (err) {
    console.warn("Could not save image to cloud database:", err);
  }

  // 2. Offline binary cache (IndexedDB only — never the source of truth)
  try {
    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn("Error saving image to local indexedDB:", err);
  }

  return dbSuccess || true;
}

export async function getUserDefinedMasterImage(): Promise<string> {
  const fallback = "/user_defined_default_image.png";

  // 1. Try server-side disk persistence first
  try {
    const res = await fetch("/api/user-defined-image", { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data?.dataUrl && typeof data.dataUrl === "string") {
        return data.dataUrl;
      }
      if (data?.url && typeof data.url === "string") {
        return data.url;
      }
    }
  } catch (err) {
    console.warn("Could not fetch user-defined image from server disk:", err);
  }

  // 2. Try Firestore Cloud Database
  try {
    const dbVal = await getAppStateFromDatabase<string>("img_user_defined_master_image");
    if (dbVal && typeof dbVal === "string" && !dbVal.includes("source-01.jpg") && !dbVal.includes("eurospect_header")) {
      return dbVal;
    }
    const dbValLegacy = await getAppStateFromDatabase<string>("img_user_default_3x3_image");
    if (dbValLegacy && typeof dbValLegacy === "string" && !dbValLegacy.includes("source-01.jpg") && !dbValLegacy.includes("eurospect_header")) {
      return dbValLegacy;
    }
  } catch (err) {
    console.warn("Could not read user-defined image from Firestore:", err);
  }

  // 3. Try IndexedDB binary cache
  try {
    const db = await openDB();
    const idbVal: string | null = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get("user_defined_master_image");
      req.onsuccess = () => resolve(req.result && typeof req.result === "string" ? req.result : null);
      req.onerror = () => resolve(null);
    });
    if (idbVal && !idbVal.includes("source-01.jpg") && !idbVal.includes("eurospect_header")) {
      return idbVal;
    }
  } catch {}

  // 4. Try synchronous remote store
  try {
    const memVal = remoteStore.getItem("seqcarver_user_defined_master_image") || remoteStore.getItem("seqcarver_user_default_3x3_image");
    if (memVal && !memVal.includes("source-01.jpg") && !memVal.includes("eurospect_header")) {
      return memVal;
    }
  } catch {}

  return fallback;
}

export async function saveUserDefinedMasterImage(dataUrl: string): Promise<boolean> {
  if (!dataUrl) return false;

  // 1. Mirror to remoteStore synchronously
  try {
    remoteStore.setItem("seqcarver_user_defined_master_image", dataUrl);
    remoteStore.setItem("seqcarver_user_default_3x3_image", dataUrl);
    remoteStore.setItem("seqcarver_originalSpreadImage", dataUrl);
  } catch {}

  // 2. Save to server-side disk API so code rewrites & reboots preserve it
  try {
    await fetch("/api/user-defined-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
  } catch (e) {
    console.warn("Error posting user-defined image to server disk:", e);
  }

  // 3. Save to Firestore Cloud Database
  try {
    await saveAppStateToDatabase("img_user_defined_master_image", dataUrl);
    await saveAppStateToDatabase("img_user_default_3x3_image", dataUrl);
  } catch (e) {
    console.warn("Error saving user-defined image to Firestore:", e);
  }

  // 4. Save to IndexedDB
  try {
    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(dataUrl, "user_defined_master_image");
      store.put(dataUrl, "user_default_3x3_image");
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn("Error saving user-defined image to IndexedDB:", e);
  }

  return true;
}

export async function clearStoredDefaultImage(key: string): Promise<void> {
  try {
    await deleteAppStateFromDatabase(`img_${key}`);
  } catch {}

  try {
    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {}
}

export async function getStoredJson<T>(key: string): Promise<T | null> {
  // 1. Primary: Fetch from Firestore Cloud Database
  try {
    const cloudData = await getAppStateFromDatabase<T>(key);
    if (cloudData !== null && cloudData !== undefined) {
      return cloudData;
    }
  } catch (cloudErr) {
    console.warn(`Cloud database fetch for key '${key}' failed, trying local cache:`, cloudErr);
  }

  // 2. Secondary fallback: IndexedDB
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result !== undefined && req.result !== null) {
          resolve(req.result as T);
          return;
        }
        // Last resort: the database-backed synchronous mirror.
        resolve(remoteStore.getJSON<T | null>(`seqcarver_json_${key}`, null));
      };
      req.onerror = () => resolve(remoteStore.getJSON<T | null>(`seqcarver_json_${key}`, null));
    });
  } catch {
    return remoteStore.getJSON<T | null>(`seqcarver_json_${key}`, null);
  }
}

export async function saveStoredJson<T>(key: string, value: T): Promise<boolean> {
  // 1. Primary: Save directly to Firestore Cloud Database
  let cloudSuccess = false;
  try {
    cloudSuccess = await saveAppStateToDatabase(key, value);
  } catch (err) {
    console.warn(`Firestore cloud save for key '${key}' fallback to local storage:`, err);
  }

  // 2. Secondary: database-backed synchronous mirror for small payloads
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length < 60 * 1024) {
      remoteStore.setItem(`seqcarver_json_${key}`, serialized);
    } else {
      remoteStore.removeItem(`seqcarver_json_${key}`);
    }
  } catch {
    try {
      remoteStore.removeItem(`seqcarver_json_${key}`);
    } catch {}
  }

  try {
    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn("Error saving json to local indexedDB:", err);
  }

  return cloudSuccess;
}

export async function clearStoredJson(key: string): Promise<void> {
  try {
    await deleteAppStateFromDatabase(key);
  } catch {}

  try {
    remoteStore.removeItem(`seqcarver_json_${key}`);
    remoteStore.removeItem(key);
  } catch {}

  try {
    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {}
}

export async function clearAllStoredState(): Promise<void> {
  try {
    const keys = remoteStore.keys();
    for (const k of keys) {
      const isProtected =
        !k.startsWith("seqcarver_") ||
        k.includes("creative_studio") ||
        k.includes("button_custom") ||
        k.includes("customization_settings") ||
        k.includes("btn_customizer_") ||
        k.includes("button_quick_slots") ||
        k.includes("default_state") ||
        k.includes("user_default") ||
        k.includes("user_defined") ||
        k.includes("master_image") ||
        k.includes("default_version") ||
        k.includes("storyboard_default") ||
        k.includes("defaultBox") ||
        k.includes("originalSpread") ||
        k.includes("boxImages") ||
        k.includes("boxLinkConfigs") ||
        k.includes("boxRotation") ||
        k.includes("crop_default") ||
        k.includes("crop_panels_order") ||
        k.includes("crop_quick_tools_order") ||
        k.includes("crop_sb_frame_order") ||
        k.includes("crop_aspect_order") ||
        k.includes("crop_primary_order") ||
        k.includes("crop_utility_order") ||
        k.includes("crop_ss_order") ||
        k.includes("crop_multicrop_batch_order");

      if (!isProtected) {
        remoteStore.removeItem(k);
      }
    }
  } catch {}

  try {
    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          const key = String(cursor.key);
          const isProtectedKey =
            key.includes("creative_studio") ||
            key.includes("button_custom") ||
            key.includes("customization_settings") ||
            key.includes("btn_customizer") ||
            key.includes("button_quick_slots") ||
            key.includes("default_state") ||
            key.includes("user_default") ||
            key.includes("user_defined") ||
            key.includes("master_image") ||
            key.includes("default_version") ||
            key.includes("storyboard_default") ||
            key.includes("defaultBox") ||
            key.includes("originalSpread") ||
            key.includes("boxImages") ||
            key.includes("boxLinkConfigs") ||
            key.includes("boxRotation") ||
            key.includes("crop_default") ||
            key.includes("crop_panels_order") ||
            key.includes("crop_quick_tools") ||
            key.includes("crop_sb_frame") ||
            key.includes("crop_aspect") ||
            key.includes("crop_primary") ||
            key.includes("crop_utility") ||
            key.includes("crop_ss_") ||
            key.includes("crop_multicrop");
          if (!isProtectedKey) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve(true);
        }
      };
      cursorReq.onerror = () => resolve(false);
    });
  } catch {}
}
