import { initializeApp, getApps, getApp, setLogLevel } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { USER_DEFAULT_EXPORT_JSON } from "../types/hardcodedDefaultConfig";
import { optimizeImageForFirestore } from "../utils/imageOptimizer";

export type { User };

// Suppress internal Firebase SDK assertion noise (e.g. pending promise popup cancels)
setLogLevel("silent");

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
/* CRITICAL: The app will break without this line passing firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot as required by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
void testConnection();

// ------------------------------------------------------------------
// Auth Readiness & Helpers
// ------------------------------------------------------------------
let authReadyFlag = false;
let resolveAuthReady: ((user: User | null) => void) | null = null;
const authReadyPromise = new Promise<User | null>((resolve) => {
  resolveAuthReady = resolve;
});

onAuthStateChanged(auth, (user) => {
  if (!authReadyFlag) {
    authReadyFlag = true;
    resolveAuthReady?.(user);
  }
});

/** Resolves once Firebase Auth has restored any persisted user session from IndexedDB. */
export function waitForAuthReady(timeoutMs = 3500): Promise<User | null> {
  if (authReadyFlag) return Promise.resolve(auth.currentUser);
  return Promise.race([
    authReadyPromise,
    new Promise<User | null>((resolve) =>
      setTimeout(() => resolve(auth.currentUser), timeoutMs)
    ),
  ]);
}

export function isAuthReady(): boolean {
  return authReadyFlag;
}

export function isVerifiedCurrentUser(user: User | null = auth.currentUser): user is User {
  return Boolean(user && user.uid && user.emailVerified === true && !user.isAnonymous);
}

/** Sanitizes an identifier segment to strictly match `^[a-zA-Z0-9_\-]+$` (1..maxLen). */
export function sanitizeIdSegment(raw: string, maxLen = 88): string {
  const cleaned = String(raw || "")
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLen);
  return cleaned || "default";
}

/** Builds a user-scoped Firestore document ID guaranteed to match `isValidId` (1..128 chars). */
export function userScopedId(uid: string, rawKey: string, maxKeyLen = 88): string {
  const safeUid = sanitizeIdSegment(uid, 36);
  const safeKey = sanitizeIdSegment(rawKey, Math.min(maxKeyLen, 126 - safeUid.length));
  return `${safeUid}_${safeKey}`.slice(0, 128);
}

function formatFirestoreTimestamp(value: unknown): string {
  if (!value) return "";
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as any).toDate === "function") {
    try {
      return (value as any).toDate().toISOString();
    } catch {
      return "";
    }
  }
  if (typeof value === "string") return value;
  return "";
}

// Master Configuration database operations
export const MAIN_CONFIG_DOC_ID = "main_config";

/**
 * Recursively strips all `undefined` values from an object, array, or primitive.
 * Firestore strictly forbids `undefined` field values in document writes.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== "object") {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }
  if (data instanceof Timestamp) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

function boundMapEntries(input: unknown, maxKeys: number): Record<string, any> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  const sanitized = sanitizeForFirestore(input as Record<string, any>);
  const entries = Object.entries(sanitized);
  if (entries.length <= maxKeys) return sanitized;
  return Object.fromEntries(entries.slice(0, maxKeys));
}

/**
 * Recursively inspects payload and strips base64 Data URIs or massive strings (>80KB),
 * offloading base64 image URIs to app_states so image assets are preserved independently.
 */
function pruneLargeDataFromConfig(obj: any, maxLen: number = 80000, parentKey: string = ""): any {
  if (!obj || typeof obj !== "object") {
    if (typeof obj === "string" && obj.length > maxLen) {
      if (obj.startsWith("data:image/")) {
        const storeKey = parentKey ? `img_item_${parentKey}` : "img_blob";
        saveAppStateToDatabase(storeKey, obj).catch(() => {});
        return `[STORED_IN_APP_STATES:${storeKey}]`;
      }
      return obj.slice(0, maxLen);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item, idx) => pruneLargeDataFromConfig(item, maxLen, `${parentKey}_${idx}`));
  }
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (parentKey === "header_logo" && k === "customIconData" && typeof v === "string" && v.length < 120000) {
      clean[k] = v;
      continue;
    }

    if (typeof v === "string" && v.length > maxLen) {
      if (v.startsWith("data:image/")) {
        const storeKey = parentKey ? `img_btn_icon_${parentKey}` : `img_${k}`;
        saveAppStateToDatabase(storeKey, v).catch(() => {});
        clean[k] = `[STORED_IN_APP_STATES:${storeKey}]`;
      } else {
        clean[k] = v.slice(0, maxLen);
      }
    } else {
      clean[k] = pruneLargeDataFromConfig(v, maxLen, k);
    }
  }
  return clean;
}

function buildAppConfigDocument(
  uid: string,
  docId: string,
  configKey: string,
  rawConfig: Record<string, any>,
  maxStringLen = 80000
) {
  const pruned = sanitizeForFirestore(pruneLargeDataFromConfig(rawConfig || {}, maxStringLen));
  const globalSettings = boundMapEntries(pruned.globalSettings || {}, 500);
  const customConfigs = boundMapEntries(pruned.customConfigs || {}, 10000);

  if (Array.isArray(globalSettings.buttonOrder)) {
    globalSettings.buttonOrder = Array.from(new Set(globalSettings.buttonOrder.filter(Boolean)));
  }
  if (Array.isArray(globalSettings.panelControlsOrder)) {
    globalSettings.panelControlsOrder = Array.from(
      new Set(
        globalSettings.panelControlsOrder.filter(
          (id: string) =>
            Boolean(id) &&
            id !== "rotation" &&
            id !== "front_page_ad_global_rotation" &&
            id !== "tilelink" &&
            id !== "front_page_ad_tilelink_modal"
        )
      )
    );
  }
  if (Array.isArray(globalSettings.headerItemsOrder)) {
    globalSettings.headerItemsOrder = Array.from(new Set(globalSettings.headerItemsOrder.filter(Boolean)));
  }

  const excludedRootKeys = new Set([
    "id",
    "configKey",
    "ownerId",
    "version",
    "appName",
    "globalSettings",
    "customConfigs",
    "payload",
    "updatedAt",
    "sections",
    "allButtonStates",
  ]);

  const extraMeta: Record<string, any> = {
    ...(pruned.payload && typeof pruned.payload === "object" && !Array.isArray(pruned.payload)
      ? pruned.payload
      : {}),
  };
  for (const [k, v] of Object.entries(pruned)) {
    if (!excludedRootKeys.has(k) && v !== undefined) {
      extraMeta[k] = v;
    }
  }
  extraMeta.updatedBy = auth.currentUser?.email || uid;

  const version = String(pruned.version || "3.0").trim().slice(0, 50) || "3.0";
  const appName =
    String(pruned.versionName || pruned.appName || "SeqCarver")
      .trim()
      .slice(0, 100) || "SeqCarver";

  return {
    id: docId,
    configKey,
    ownerId: uid,
    version,
    appName,
    globalSettings,
    customConfigs,
    payload: boundMapEntries(extraMeta, 500),
    updatedAt: serverTimestamp(),
  };
}

function unpackAppConfigDocument(docData: Record<string, any>, fallbackKey: string): Record<string, any> {
  const payload =
    docData.payload && typeof docData.payload === "object" && !Array.isArray(docData.payload)
      ? docData.payload
      : {};
  return {
    ...payload,
    id: docData.configKey || fallbackKey,
    version: docData.version || "3.0",
    appName: docData.appName || "SeqCarver",
    globalSettings: docData.globalSettings || {},
    customConfigs: docData.customConfigs || {},
    updatedAt: formatFirestoreTimestamp(docData.updatedAt) || payload.timestamp || "",
  };
}

/**
 * Fetch user configuration from Firestore.
 * When signed out, cleanly returns factory defaults without touching Firestore.
 * When signed in and `main_config` does not yet exist for this user, seeds it cleanly.
 */
export async function getDatabaseConfig(configId: string = MAIN_CONFIG_DOC_ID): Promise<any> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return USER_DEFAULT_EXPORT_JSON as any;
  }

  const configKey = sanitizeIdSegment(configId || MAIN_CONFIG_DOC_ID, 88);
  const docId = userScopedId(user.uid, configKey, 88);
  const path = `configurations/${docId}`;

  try {
    const docRef = doc(db, "configurations", docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = unpackAppConfigDocument(snap.data() as Record<string, any>, configKey);

      if (
        data &&
        (data.originalSpreadImage === "[STORED_IN_APP_STATES]" ||
          !data.originalSpreadImage ||
          String(data.originalSpreadImage).includes("[STORED_IN_APP_STATES"))
      ) {
        try {
          const spreadImg = await getAppStateFromDatabase<string>("img_originalSpreadImage");
          if (spreadImg) {
            data.originalSpreadImage = spreadImg;
          } else {
            const userDefImg = await getAppStateFromDatabase<string>("user_default_3x3_image");
            if (userDefImg) data.originalSpreadImage = userDefImg;
          }
        } catch {}
      }

      try {
        const userDefImg = await getAppStateFromDatabase<string>("user_default_3x3_image");
        if (userDefImg) {
          data.userDefault3x3Image = userDefImg;
        }
      } catch {}

      try {
        const remoteLogo = await getAppStateFromDatabase<any>("header_logo_custom_config");
        if (remoteLogo && typeof remoteLogo === "object") {
          if (!data.customConfigs) data.customConfigs = {};
          data.customConfigs.header_logo = {
            ...(data.customConfigs.header_logo || {}),
            ...remoteLogo,
          };
        }
      } catch {}

      if (data.customConfigsOverflowKey && typeof data.customConfigsOverflowKey === "string") {
        try {
          const overflowMap = await getAppStateFromDatabase<Record<string, any>>(
            data.customConfigsOverflowKey
          );
          if (overflowMap && typeof overflowMap === "object") {
            data.customConfigs = {
              ...(data.customConfigs || {}),
              ...overflowMap,
            };
          }
        } catch {}
      }

      if (data.customConfigs && typeof data.customConfigs === "object") {
        for (const [btnId, btnCfg] of Object.entries(data.customConfigs as Record<string, any>)) {
          if (btnCfg && typeof btnCfg === "object" && typeof btnCfg.customIconData === "string") {
            if (btnCfg.customIconData.startsWith("[STORED_IN_APP_STATES")) {
              const matchedKey =
                btnCfg.customIconData.match(/\[STORED_IN_APP_STATES:([^\]]+)\]/)?.[1] ||
                `img_btn_icon_${btnId}`;
              try {
                const storedIcon = await getAppStateFromDatabase<string>(matchedKey);
                if (storedIcon) {
                  btnCfg.customIconData = storedIcon;
                }
              } catch {}
            }
          }
        }
      }

      return data;
    }

    if (configKey !== MAIN_CONFIG_DOC_ID) {
      return null;
    }

    const seedSource = {
      id: MAIN_CONFIG_DOC_ID,
      version: USER_DEFAULT_EXPORT_JSON.version || "3.0",
      appName: USER_DEFAULT_EXPORT_JSON.appName || "SeqCarver",
      exportType: USER_DEFAULT_EXPORT_JSON.exportType || "button_and_label_customization_backup",
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString(),
      buttonCount: (USER_DEFAULT_EXPORT_JSON as any).buttonCount || 607,
      totalButtonsConfigured: (USER_DEFAULT_EXPORT_JSON as any).totalButtonsConfigured || 0,
      totalSectionsCovered: (USER_DEFAULT_EXPORT_JSON as any).totalSectionsCovered || 19,
      globalSettings: USER_DEFAULT_EXPORT_JSON.globalSettings || {},
      customConfigs: USER_DEFAULT_EXPORT_JSON.customConfigs || {},
      buttonOrder:
        (USER_DEFAULT_EXPORT_JSON.globalSettings as any)?.buttonOrder ||
        (USER_DEFAULT_EXPORT_JSON as any).buttonOrder ||
        [],
      quickSlots: (USER_DEFAULT_EXPORT_JSON as any).quickSlots || [],
    };
    const seedDoc = buildAppConfigDocument(user.uid, docId, MAIN_CONFIG_DOC_ID, seedSource, 80000);
    try {
      await setDoc(docRef, seedDoc);
    } catch (seedError) {
      handleFirestoreError(seedError, OperationType.CREATE, path);
    }
    return {
      ...seedSource,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || user.uid,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('{"error":')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save / Update user configuration in Firestore.
 * Returns `false` cleanly when signed out so local changes stay in memory/IndexedDB until sign-in.
 */
export async function saveDatabaseConfig(
  configData: any,
  configId: string = MAIN_CONFIG_DOC_ID
): Promise<boolean> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return false;
  }

  const configKey = sanitizeIdSegment(configId || MAIN_CONFIG_DOC_ID, 88);
  const docId = userScopedId(user.uid, configKey, 88);
  const path = `configurations/${docId}`;

  try {
    const docRef = doc(db, "configurations", docId);

    if (configData?.customConfigs?.header_logo) {
      saveAppStateToDatabase("header_logo_custom_config", configData.customConfigs.header_logo).catch(() => {});
      if (
        typeof configData.customConfigs.header_logo.customIconData === "string" &&
        configData.customConfigs.header_logo.customIconData.startsWith("data:image/")
      ) {
        saveAppStateToDatabase(
          "img_btn_icon_header_logo",
          configData.customConfigs.header_logo.customIconData
        ).catch(() => {});
      }
    }

    if (configData?.userDefault3x3Image && typeof configData.userDefault3x3Image === "string") {
      saveAppStateToDatabase("user_default_3x3_image", configData.userDefault3x3Image).catch(() => {});
    }
    if (
      configData?.originalSpreadImage &&
      typeof configData.originalSpreadImage === "string" &&
      !configData.originalSpreadImage.includes("[STORED_IN_APP_STATES")
    ) {
      saveAppStateToDatabase("img_originalSpreadImage", configData.originalSpreadImage).catch(() => {});
      saveAppStateToDatabase("originalSpreadImage", configData.originalSpreadImage).catch(() => {});
    }
    if (
      configData?.defaultBox1Image &&
      typeof configData.defaultBox1Image === "string" &&
      !configData.defaultBox1Image.includes("[STORED_IN_APP_STATES")
    ) {
      saveAppStateToDatabase("img_defaultBox1Image", configData.defaultBox1Image).catch(() => {});
      saveAppStateToDatabase("defaultBox1Image", configData.defaultBox1Image).catch(() => {});
    }
    if (configData?.boxImages && typeof configData.boxImages === "object") {
      saveAppStateToDatabase("boxImages", configData.boxImages).catch(() => {});
      saveAppStateToDatabase("defaultBoxImages", configData.defaultBoxImages || configData.boxImages).catch(
        () => {}
      );
      Object.entries(configData.boxImages).forEach(([boxKey, boxImg]) => {
        if (typeof boxImg === "string" && boxImg.startsWith("data:image/")) {
          saveAppStateToDatabase(`img_${boxKey}`, boxImg).catch(() => {});
        }
      });
    }

    let docPayload = buildAppConfigDocument(user.uid, docId, configKey, configData || {}, 80000);
    let approxBytes = JSON.stringify({
      ...docPayload,
      updatedAt: "2026-01-01T00:00:00.000Z",
    }).length;

    if (approxBytes > 850000) {
      docPayload = buildAppConfigDocument(user.uid, docId, configKey, configData || {}, 10000);
      approxBytes = JSON.stringify({
        ...docPayload,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }).length;
    }

    if (approxBytes > 850000 && docPayload.customConfigs) {
      const overflowKey = sanitizeIdSegment(`custom_configs_overflow_${configKey}`, 72);
      await saveAppStateToDatabase(overflowKey, docPayload.customConfigs);
      docPayload = {
        ...docPayload,
        customConfigs: docPayload.customConfigs.header_logo
          ? { header_logo: docPayload.customConfigs.header_logo }
          : {},
        payload: boundMapEntries(
          {
            ...docPayload.payload,
            customConfigsOverflowKey: overflowKey,
          },
          500
        ),
      };
    }

    await setDoc(docRef, docPayload);
    return true;
  } catch (error) {
    const errText = error instanceof Error ? error.message : String(error);
    if (
      errText.includes("RESOURCE_EXHAUSTED") ||
      errText.includes("Quota exceeded") ||
      errText.includes("quota")
    ) {
      console.warn("Firestore write quota exceeded; changes safely cached locally until quota resets.");
      return false;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to real-time configuration updates for the authenticated user.
 * Strictly attaches `onSnapshot` ONLY while auth is ready and user is authenticated.
 */
export function subscribeToDatabaseConfig(
  onUpdate: (config: any) => void,
  configId: string = MAIN_CONFIG_DOC_ID
): () => void {
  const configKey = sanitizeIdSegment(configId || MAIN_CONFIG_DOC_ID, 88);
  let snapshotUnsub: (() => void) | null = null;
  let activeUid: string | null = null;

  const teardownSnapshot = () => {
    if (snapshotUnsub) {
      snapshotUnsub();
      snapshotUnsub = null;
    }
    activeUid = null;
  };

  const authUnsub = onAuthStateChanged(auth, (user) => {
    if (!isVerifiedCurrentUser(user)) {
      teardownSnapshot();
      return;
    }
    if (activeUid === user.uid && snapshotUnsub) {
      return;
    }
    teardownSnapshot();
    activeUid = user.uid;
    const docId = userScopedId(user.uid, configKey, 88);
    const path = `configurations/${docId}`;
    const docRef = doc(db, "configurations", docId);
    snapshotUnsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(unpackAppConfigDocument(snap.data() as Record<string, any>, configKey));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  });

  return () => {
    authUnsub();
    teardownSnapshot();
  };
}

/**
 * List all saved configurations belonging to the authenticated user.
 */
export async function listDatabaseConfigs(): Promise<Array<{ id: string; name: string; updatedAt: string }>> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return [];
  }

  const path = "configurations";
  try {
    const q = query(collection(db, "configurations"), where("ownerId", "==", user.uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, any>;
      const logicalId = data.configKey || d.id;
      const versionName = data.payload?.versionName;
      return {
        id: logicalId,
        name: versionName || data.appName || logicalId,
        updatedAt: formatFirestoreTimestamp(data.updatedAt) || data.payload?.timestamp || "",
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ------------------------------------------------------------------
// Per-User App State Persistence (`app_states`)
// ------------------------------------------------------------------
export async function saveAppStateToDatabase(key: string, data: any): Promise<boolean> {
  if (data === undefined || data === null) {
    return false;
  }
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return false;
  }

  const stateKey = sanitizeIdSegment(key, 72);
  const docId = userScopedId(user.uid, stateKey, 72);
  const path = `app_states/${docId}`;

  try {
    let serialized = typeof data === "string" ? data : JSON.stringify(data);

    if (serialized.length > 500000 && typeof data === "string" && data.startsWith("data:image/")) {
      try {
        const optimized = await optimizeImageForFirestore(data, 1400, 0.86);
        if (optimized && optimized.length < serialized.length) {
          serialized = optimized;
        }
      } catch (e) {
        console.warn("Image optimization notice:", e);
      }
    }

    const CHUNK_SIZE = 600000;
    const docRef = doc(db, "app_states", docId);

    if (serialized.length <= CHUNK_SIZE) {
      await setDoc(docRef, {
        id: docId,
        stateKey,
        ownerId: user.uid,
        data: serialized,
        isChunked: false,
        chunkIndex: 0,
        totalChunks: 1,
        totalSize: serialized.length,
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    const totalChunks = Math.min(200, Math.ceil(serialized.length / CHUNK_SIZE));
    const chunkPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = serialized.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkKey = `${stateKey}_c_${i}`;
      const chunkDocId = userScopedId(user.uid, chunkKey, 84);
      chunkPromises.push(
        setDoc(doc(db, "app_states", chunkDocId), {
          id: chunkDocId,
          stateKey: chunkKey,
          ownerId: user.uid,
          data: chunkData,
          isChunked: true,
          chunkIndex: i,
          totalChunks,
          totalSize: serialized.length,
          updatedAt: serverTimestamp(),
        })
      );
    }
    await Promise.all(chunkPromises);

    await setDoc(docRef, {
      id: docId,
      stateKey,
      ownerId: user.uid,
      data: "",
      isChunked: true,
      chunkIndex: 0,
      totalChunks,
      totalSize: serialized.length,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    const errText = error instanceof Error ? error.message : String(error);
    if (
      errText.includes("RESOURCE_EXHAUSTED") ||
      errText.includes("Quota exceeded") ||
      errText.includes("quota")
    ) {
      return false;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAppStateFromDatabase<T>(key: string): Promise<T | null> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return null;
  }

  const stateKey = sanitizeIdSegment(key, 72);
  const docId = userScopedId(user.uid, stateKey, 72);
  const path = `app_states/${docId}`;

  try {
    const docRef = doc(db, "app_states", docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const docData = snap.data();
    if (!docData) return null;

    let raw = docData.data as string;

    if (docData.isChunked && docData.totalChunks) {
      const chunkCount = docData.totalChunks as number;
      const chunkFetches = [];
      for (let i = 0; i < chunkCount; i++) {
        const chunkDocId = userScopedId(user.uid, `${stateKey}_c_${i}`, 84);
        chunkFetches.push(getDoc(doc(db, "app_states", chunkDocId)));
      }
      const chunkSnaps = await Promise.all(chunkFetches);
      raw = chunkSnaps.map((cs) => cs.data()?.data || "").join("");
    }

    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function deleteAppStateFromDatabase(key: string): Promise<void> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return;
  }

  const stateKey = sanitizeIdSegment(key, 72);
  const docId = userScopedId(user.uid, stateKey, 72);
  const path = `app_states/${docId}`;

  try {
    const docRef = doc(db, "app_states", docId);
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      await deleteDoc(docRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ------------------------------------------------------------------
// Global Safety Interceptors for Firebase Auth Popup Events in iFrames
// ------------------------------------------------------------------
if (typeof window !== "undefined") {
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason || "");
      const code = reason?.code || "";
      if (
        msg.includes("INTERNAL ASSERTION FAILED") ||
        msg.includes("Pending promise was never set") ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/user-cancelled" ||
        msg.includes("cancelled-popup-request") ||
        msg.includes("popup-blocked")
      ) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );

  window.addEventListener(
    "error",
    (event) => {
      const msg = event?.message || event?.error?.message || "";
      if (
        msg.includes("INTERNAL ASSERTION FAILED") ||
        msg.includes("Pending promise was never set") ||
        msg.includes("auth/cancelled-popup-request") ||
        msg.includes("auth/popup-blocked") ||
        msg.includes("popup-closed-by-user")
      ) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
        return true;
      }
    },
    true
  );
}

// ------------------------------------------------------------------
// Real User Google Sign-In (No Hardcoded or Synthesized Fallback Users)
// ------------------------------------------------------------------
let activeLoginPromise: Promise<User | null> | null = null;
let isSigningIn = false;
let lastAuthErrorNotice: string | null = null;

export interface ActiveDbProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}

/** Current authenticated user profile from Firebase Auth (null when signed out). */
export function getActiveDbProfile(): ActiveDbProfile | null {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

export function getLastAuthError(): string | null {
  return lastAuthErrorNotice;
}

const authSubscribers = new Set<(user: User | null) => void>();

export function notifyAuthSubscribers(user: User | null) {
  authSubscribers.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.warn("Auth subscriber callback err:", e);
    }
  });
}

/**
 * Standard Google OAuth Popup Sign-In for the actual user.
 * Prompts account selection so the user signs in with their own Google account.
 */
export async function loginWithGoogle(): Promise<User | null> {
  if (isSigningIn || activeLoginPromise) {
    return activeLoginPromise || null;
  }

  isSigningIn = true;
  lastAuthErrorNotice = null;
  activeLoginPromise = (async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const res = await signInWithPopup(auth, provider);
      if (res?.user) {
        notifyAuthSubscribers(res.user);
        return res.user;
      }
      return null;
    } catch (err: any) {
      const code = err?.code || "";
      const msg = err?.message || String(err || "");

      if (code === "auth/popup-blocked") {
        lastAuthErrorNotice =
          "Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.";
      } else if (code === "auth/unauthorized-domain" || msg.includes("unauthorized domain")) {
        lastAuthErrorNotice =
          "This preview domain is not yet authorized in Firebase Authentication.";
      } else if (
        code === "auth/cancelled-popup-request" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/user-cancelled"
      ) {
        lastAuthErrorNotice = "Google sign-in was cancelled.";
      } else if (msg.includes("INTERNAL ASSERTION FAILED") || msg.includes("Pending promise")) {
        lastAuthErrorNotice = "Sign-in window closed. Click Sign in with Google to try again.";
      } else {
        lastAuthErrorNotice = `Google sign-in notice: ${msg}`;
      }
      console.warn(lastAuthErrorNotice);
      return null;
    } finally {
      setTimeout(() => {
        isSigningIn = false;
        activeLoginPromise = null;
      }, 300);
    }
  })();

  return activeLoginPromise;
}

/** Triggers Google popup authentication. */
export async function loginAsDevUser(_email?: string): Promise<User | null> {
  return loginWithGoogle();
}

export async function logoutUser(): Promise<void> {
  lastAuthErrorNotice = null;
  try {
    await signOut(auth);
  } catch {}
  notifyAuthSubscribers(null);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  authSubscribers.add(callback);

  const unsub = onAuthStateChanged(auth, (user) => {
    callback(user);
  });

  return () => {
    authSubscribers.delete(callback);
    unsub();
  };
}
