/**
 * Remote Key/Value Store — database-backed replacement for `localStorage`
 * =======================================================================
 * Persists studio configuration keys in per-user Firestore shards (`ui_kv/{uid}_{shard}`).
 *
 *   • Unauthenticated sessions operate cleanly in memory with zero Firestore traffic.
 *   • Once the user signs in with Google, shards hydrate from their own database,
 *     pending local mutations flush automatically, and live `onSnapshot` keeps tabs synced.
 */

import {
  doc,
  getDocs,
  collection,
  onSnapshot,
  setDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  db,
  auth,
  waitForAuthReady,
  isVerifiedCurrentUser,
  sanitizeIdSegment,
  userScopedId,
  subscribeToAuth,
  getAppStateFromDatabase,
  saveAppStateToDatabase,
  handleFirestoreError,
  OperationType,
} from "./firebase";
import type { UIConfigSyncStatus } from "../types/uiConfigSchema";

/** Firestore collection holding the sharded configuration mirror. */
export const UI_KV_COLLECTION = "ui_kv";

/** Values larger than this are offloaded into their own `app_states` document. */
const OFFLOAD_THRESHOLD = 20_000;
const OFFLOAD_PREFIX = "__ui_kv_offload__:";

/** Debounce window for batching remote writes. */
const FLUSH_DEBOUNCE_MS = 700;
/** Hard ceiling on boot hydration so a cold/offline database never blocks the UI. */
const HYDRATE_TIMEOUT_MS = 6_000;

const SHARD_RULES: Array<{ test: RegExp; shard: string }> = [
  {
    test: /button_customizations|customization_settings|has_saved_user_default|quick_slots|header_logo|default_version_marker/,
    shard: "studio_core",
  },
  {
    test: /_order$|_order_|panel_controls|crop_panels|crop_quick_tools|crop_aspect|crop_primary|crop_utility|crop_sb_frame|crop_ss_order|multicrop_batch/,
    shard: "layout_order",
  },
  { test: /adv_modal|utility_modal|creative_studio|control_deck|shortcut/, shard: "modal_layout" },
  {
    test: /krums|shapestudio|neo1|zoom|sharpen|resample|variations|bubba|messhi|trace|parallax|screenplay|txtstudio|imgdesc/,
    shard: "studio_state",
  },
  { test: /image|spread|box|artwork|library|asset|thumb|psd|frame/, shard: "asset_state" },
];

function shardFor(key: string): string {
  const k = key.toLowerCase();
  for (const rule of SHARD_RULES) if (rule.test.test(k)) return rule.shard;
  return "general";
}

type KeyListener = (keys: string[]) => void;
type StatusListener = (status: UIConfigSyncStatus) => void;

const memory = new Map<string, string>();
const committed = new Map<string, string>();
const dirty = new Set<string>();
const tombstones = new Set<string>();

const keyListeners = new Set<KeyListener>();
const statusListeners = new Set<StatusListener>();
const liveUnsubscribers: Array<() => void> = [];
let activeListenerUid: string | null = null;

let hydrated = false;
let hydrating: Promise<void> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushInFlight: Promise<void> | null = null;

let status: UIConfigSyncStatus = {
  state: "idle",
  pending: 0,
  lastSyncedAt: null,
  lastError: null,
};

const scheduleNotify =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : (fn: () => void) => Promise.resolve().then(fn);

function setStatus(patch: Partial<UIConfigSyncStatus>) {
  status = { ...status, ...patch, pending: dirty.size + tombstones.size };
  const currentStatus = status;
  scheduleNotify(() => {
    statusListeners.forEach((cb) => {
      try {
        cb(currentStatus);
      } catch {
        /* listener errors must never break persistence */
      }
    });
  });
}

function notifyKeys(keys: string[]) {
  if (!keys.length) return;
  const keysCopy = [...keys];
  scheduleNotify(() => {
    keyListeners.forEach((cb) => {
      try {
        cb(keysCopy);
      } catch {
        /* ignore */
      }
    });
  });
}

/* ------------------------------------------------------------------ *
 * Hydration & Per-User Live Subscription
 * ------------------------------------------------------------------ */

async function resolveOffloadedPointer(key: string, pointer: string): Promise<void> {
  const stateKey = pointer.slice(OFFLOAD_PREFIX.length);
  try {
    const value = await getAppStateFromDatabase<string>(stateKey);
    if (typeof value === "string") {
      memory.set(key, value);
      committed.set(key, value);
      notifyKeys([key]);
    }
  } catch {
    /* pointer resolution is best-effort */
  }
}

function ingestShardData(data: Record<string, unknown> | undefined, opts: { live: boolean }) {
  if (!data) return;
  const entries = (data.entries || {}) as Record<string, string>;
  const changed: string[] = [];
  const deferred: Array<Promise<void>> = [];

  for (const [key, raw] of Object.entries(entries)) {
    if (typeof raw !== "string") continue;
    if (dirty.has(key) || tombstones.has(key)) continue;

    if (raw.startsWith(OFFLOAD_PREFIX)) {
      committed.set(key, raw);
      deferred.push(resolveOffloadedPointer(key, raw));
      continue;
    }
    if (memory.get(key) !== raw) {
      memory.set(key, raw);
      changed.push(key);
    }
    committed.set(key, raw);
  }

  if (opts.live) {
    const shardKeys = new Set(Object.keys(entries));
    const shardName = String(data.shard || "");
    for (const key of Array.from(memory.keys())) {
      if (shardFor(key) !== shardName) continue;
      if (shardKeys.has(key) || dirty.has(key) || tombstones.has(key)) continue;
      memory.delete(key);
      committed.delete(key);
      changed.push(key);
    }
  }

  notifyKeys(changed);
  void Promise.all(deferred);
}

function detachLiveListeners() {
  while (liveUnsubscribers.length) {
    const unsub = liveUnsubscribers.pop();
    try {
      unsub?.();
    } catch {}
  }
  activeListenerUid = null;
}

function attachLiveListeners(uid: string) {
  if (activeListenerUid === uid && liveUnsubscribers.length > 0) return;
  detachLiveListeners();
  activeListenerUid = uid;
  try {
    const q = query(collection(db, UI_KV_COLLECTION), where("ownerId", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "removed") return;
          ingestShardData(change.doc.data() as Record<string, unknown>, { live: true });
        });
        setStatus({ state: dirty.size ? "saving" : "saved", lastError: null });
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, UI_KV_COLLECTION);
        } catch {
          setStatus({ state: "offline", lastError: err?.message || String(err) });
        }
      }
    );
    liveUnsubscribers.push(unsub);
  } catch (err: any) {
    console.warn("[remoteKeyValueStore] could not attach live listener:", err?.message || err);
  }
}

async function fetchUserShards(uid: string): Promise<void> {
  const q = query(collection(db, UI_KV_COLLECTION), where("ownerId", "==", uid));
  const fetchPromise = getDocs(q).catch((err) => {
    try {
      handleFirestoreError(err, OperationType.LIST, UI_KV_COLLECTION);
    } catch {
      /* surfaced via status below */
    }
    return null;
  });

  const snap = await Promise.race([
    fetchPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), HYDRATE_TIMEOUT_MS)),
  ]);

  if (snap) {
    snap.forEach((docSnap) =>
      ingestShardData(docSnap.data() as Record<string, unknown>, { live: false })
    );
    setStatus({ state: "saved", lastSyncedAt: new Date().toISOString(), lastError: null });
  } else {
    setStatus({ state: "idle", lastError: null });
  }
}

/**
 * Hydrates the configuration mirror when authenticated; resolves cleanly with
 * in-memory defaults when signed out so boot never triggers unauthenticated reads.
 */
export function hydrateRemoteStore(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;

  hydrating = (async () => {
    try {
      const user = await waitForAuthReady(3500);
      if (!isVerifiedCurrentUser(user)) {
        setStatus({ state: "idle", lastSyncedAt: null, lastError: null });
        return;
      }
      setStatus({ state: "hydrating", lastError: null });
      await fetchUserShards(user.uid);
      attachLiveListeners(user.uid);
    } catch (err: any) {
      console.warn("[remoteKeyValueStore] hydration warning:", err?.message || err);
      setStatus({ state: "idle", lastError: null });
    } finally {
      hydrated = true;
    }
  })();

  return hydrating;
}

// Automatically sync shards & listeners when the user signs in or signs out
subscribeToAuth((user) => {
  if (!isVerifiedCurrentUser(user)) {
    detachLiveListeners();
    setStatus({ state: "idle", lastError: null });
    return;
  }

  if (activeListenerUid !== user.uid) {
    void (async () => {
      await fetchUserShards(user.uid);
      attachLiveListeners(user.uid);
      if (dirty.size || tombstones.size) {
        void flushRemoteStore();
      }
    })();
  }
});

export function isRemoteStoreHydrated(): boolean {
  return hydrated;
}

/* ------------------------------------------------------------------ *
 * Flushing
 * ------------------------------------------------------------------ */

function scheduleFlush() {
  if (!isVerifiedCurrentUser(auth.currentUser)) {
    setStatus({ state: "idle", lastError: null });
    return;
  }
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushRemoteStore();
  }, FLUSH_DEBOUNCE_MS);
  setStatus({ state: "saving" });
}

/** Immediately pushes every pending mutation to the user's Firestore shards if authenticated. */
export async function flushRemoteStore(): Promise<void> {
  if (flushInFlight) return flushInFlight;
  if (!dirty.size && !tombstones.size) return;

  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    // Keep edits queued locally in memory until the user signs in.
    setStatus({ state: "idle", lastError: null });
    return;
  }

  const uid = user.uid;
  const batchKeys = Array.from(dirty);
  const removalKeys = Array.from(tombstones);
  dirty.clear();
  tombstones.clear();

  flushInFlight = (async () => {
    const affectedShards = new Set<string>();
    for (const key of batchKeys) affectedShards.add(shardFor(key));
    for (const key of removalKeys) affectedShards.add(shardFor(key));

    const rollback: string[] = [];
    let failure: string | null = null;

    await Promise.all(
      Array.from(affectedShards).map(async (shard) => {
        const entries: Record<string, string> = {};
        const shardKeys = Array.from(memory.keys())
          .filter((k) => shardFor(k) === shard)
          .slice(0, 2000);

        for (const key of shardKeys) {
          const value = memory.get(key);
          if (typeof value !== "string") continue;
          if (value.length > OFFLOAD_THRESHOLD) {
            const stateKey = sanitizeIdSegment(`ui_kv_${key}`, 72);
            try {
              await saveAppStateToDatabase(stateKey, value);
              entries[key] = `${OFFLOAD_PREFIX}${stateKey}`;
            } catch (err: any) {
              failure = err?.message || String(err);
              rollback.push(key);
            }
          } else {
            entries[key] = value;
          }
        }

        const docId = userScopedId(uid, shard, 64);
        const path = `${UI_KV_COLLECTION}/${docId}`;
        const payload = {
          shard,
          ownerId: uid,
          entries,
          schemaVersion: 2,
          updatedAt: serverTimestamp(),
        };

        try {
          await setDoc(doc(db, UI_KV_COLLECTION, docId), payload);
          for (const key of shardKeys) {
            const val = memory.get(key);
            if (typeof val === "string") committed.set(key, val);
          }
          for (const key of removalKeys) {
            if (shardFor(key) === shard) committed.delete(key);
          }
        } catch (err: any) {
          failure = err?.message || String(err);
          rollback.push(
            ...batchKeys.filter((k) => shardFor(k) === shard),
            ...removalKeys.filter((k) => shardFor(k) === shard)
          );
          try {
            handleFirestoreError(err, OperationType.WRITE, path);
          } catch {
            /* handled via rollback below */
          }
        }
      })
    );

    if (failure) {
      const rolledBack: string[] = [];
      for (const key of rollback) {
        const previous = committed.get(key);
        if (typeof previous === "string") memory.set(key, previous);
        else memory.delete(key);
        rolledBack.push(key);
      }
      notifyKeys(rolledBack);
      setStatus({ state: "error", lastError: failure });
      console.warn("[remoteKeyValueStore] flush failed, rolled back:", failure);
    } else {
      setStatus({ state: "saved", lastSyncedAt: new Date().toISOString(), lastError: null });
    }
  })().finally(() => {
    flushInFlight = null;
    if ((dirty.size || tombstones.size) && isVerifiedCurrentUser(auth.currentUser)) {
      scheduleFlush();
    }
  });

  return flushInFlight;
}

/* ------------------------------------------------------------------ *
 * Public localStorage-shaped API
 * ------------------------------------------------------------------ */

export const remoteStore = {
  getItem(key: string): string | null {
    const value = memory.get(key);
    return value === undefined ? null : value;
  },

  setItem(key: string, value: string): void {
    const next = typeof value === "string" ? value : String(value);
    if (memory.get(key) === next) return;
    memory.set(key, next);
    tombstones.delete(key);
    dirty.add(key);
    notifyKeys([key]);
    scheduleFlush();
  },

  removeItem(key: string): void {
    if (!memory.has(key) && !committed.has(key)) return;
    memory.delete(key);
    dirty.delete(key);
    tombstones.add(key);
    notifyKeys([key]);
    scheduleFlush();
  },

  key(index: number): string | null {
    return Array.from(memory.keys())[index] ?? null;
  },

  get length(): number {
    return memory.size;
  },

  clear(): void {
    const keys = Array.from(memory.keys());
    keys.forEach((k) => tombstones.add(k));
    memory.clear();
    dirty.clear();
    notifyKeys(keys);
    scheduleFlush();
  },

  getJSON<T>(key: string, fallback: T): T {
    const raw = memory.get(key);
    if (typeof raw !== "string") return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON(key: string, value: unknown): void {
    try {
      remoteStore.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[remoteKeyValueStore] could not serialize value for "${key}"`, err);
    }
  },

  subscribe(listener: KeyListener): () => void {
    keyListeners.add(listener);
    return () => keyListeners.delete(listener);
  },

  subscribeStatus(listener: StatusListener): () => void {
    statusListeners.add(listener);
    const current = status;
    scheduleNotify(() => {
      if (statusListeners.has(listener)) {
        try {
          listener(current);
        } catch {
          /* ignore */
        }
      }
    });
    return () => statusListeners.delete(listener);
  },

  getStatus(): UIConfigSyncStatus {
    return status;
  },

  keys(): string[] {
    return Array.from(memory.keys());
  },

  snapshot(): Record<string, string> {
    return Object.fromEntries(memory.entries());
  },

  hydrate: hydrateRemoteStore,
  flush: flushRemoteStore,
};

if (typeof window !== "undefined") {
  const urgentFlush = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    void flushRemoteStore();
  };
  window.addEventListener("pagehide", urgentFlush);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") urgentFlush();
  });
}

export default remoteStore;
