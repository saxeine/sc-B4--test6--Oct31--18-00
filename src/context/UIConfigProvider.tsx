/**
 * UIConfigProvider
 * ================
 * Owns all database I/O for the copy/layout registry that the
 * **Button & Layout Optimizer Studio** edits.
 *
 *   • Boot: one `fetchAllUIConfig()` read straight from the database.
 *   • Live: `onSnapshot` subscription keeps every tab in sync.
 *   • Writes: optimistic — the in-memory store updates first, the database
 *     write follows, and a rejected write is rolled back to the previous value
 *     with the error surfaced through `syncStatus`.
 *   • No `localStorage` / `sessionStorage` anywhere in the path.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  bulkUpsertUIConfig,
  fetchAllUIConfig,
  resetUIConfigRecord,
  subscribeToUIConfig,
  upsertUIConfigRecord,
} from "../services/uiConfigRepository";
import {
  dropRecord,
  getAllRecords,
  getRecord,
  getRuntimeSlots,
  mergeRecords,
  putRecord,
  registerRuntimeSlot,
  replaceAllRecords,
  resolveSlot,
  subscribeToUIConfigStore,
  type ResolvedUISlot,
} from "../services/uiConfigStore";
import {
  applyPatch,
  createRecord,
  type UIConfigPatch,
  type UIConfigRecord,
  type UIConfigSyncStatus,
  type UICopySlotDefinition,
} from "../types/uiConfigSchema";
import { remoteStore } from "../services/remoteKeyValueStore";
import { subscribeToAuth, isVerifiedCurrentUser, auth } from "../services/firebase";

export interface UIConfigContextValue {
  /** Bumped on every store mutation; consumers re-render through it. */
  revision: number;
  records: Record<string, UIConfigRecord>;
  syncStatus: UIConfigSyncStatus;
  /** Combined database + browser-storage-free KV sync indicator. */
  kvStatus: UIConfigSyncStatus;
  isHydrated: boolean;

  resolve: (elementKey: string, fallback?: string) => ResolvedUISlot;
  getRecordFor: (elementKey: string) => UIConfigRecord | undefined;

  /** Optimistic single-field edit (`text` by default). */
  setText: (elementKey: string, value: string, fallback?: string) => Promise<boolean>;
  /** Optimistic multi-field patch (copy + layout). */
  updateSlot: (elementKey: string, patch: UIConfigPatch, fallback?: string) => Promise<boolean>;
  /** Clear every override for a slot, returning it to the registry default. */
  resetSlot: (elementKey: string) => Promise<boolean>;
  /** Commit a batch of records in one round trip. */
  commitBatch: (records: UIConfigRecord[]) => Promise<boolean>;
  /** Force a fresh read from the database (studio "reload from DB"). */
  reloadFromDatabase: () => Promise<void>;
  /** Every slot known to the app: generated registry ∪ runtime discoveries. */
  listSlots: () => UICopySlotDefinition[];
}

const UIConfigContext = createContext<UIConfigContextValue | undefined>(undefined);

export function UIConfigProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<UIConfigSyncStatus>({
    state: "idle",
    pending: 0,
    lastSyncedAt: null,
    lastError: null,
  });
  const [kvStatus, setKvStatus] = useState<UIConfigSyncStatus>(remoteStore.getStatus());
  const pendingRef = useRef(0);

  // Re-render whenever the synchronous store changes (local edits or remote push).
  useEffect(() => subscribeToUIConfigStore(() => setRevision((r) => r + 1)), []);

  // Surface the database-backed KV mirror status next to the registry status.
  useEffect(() => remoteStore.subscribeStatus(setKvStatus), []);

  const markSaving = useCallback(() => {
    pendingRef.current += 1;
    setSyncStatus((prev) => ({ ...prev, state: "saving", pending: pendingRef.current }));
  }, []);

  const markSettled = useCallback((error?: string | null) => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    setSyncStatus((prev) => ({
      state: error ? "error" : pendingRef.current > 0 ? "saving" : isVerifiedCurrentUser(auth.currentUser) ? "saved" : "idle",
      pending: pendingRef.current,
      lastSyncedAt: error ? prev.lastSyncedAt : isVerifiedCurrentUser(auth.currentUser) ? new Date().toISOString() : prev.lastSyncedAt,
      lastError: error || null,
    }));
  }, []);

  /* ---------------- boot + live subscription ---------------- */

  const hydrate = useCallback(async () => {
    if (!isVerifiedCurrentUser(auth.currentUser)) {
      setIsHydrated(true);
      setSyncStatus((prev) => ({ ...prev, state: "idle", lastError: null }));
      return;
    }
    setSyncStatus((prev) => ({ ...prev, state: "hydrating", lastError: null }));
    try {
      const remote = await fetchAllUIConfig();
      replaceAllRecords(remote);
      setIsHydrated(true);
      setSyncStatus({
        state: "saved",
        pending: pendingRef.current,
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
      });
    } catch (err: any) {
      setIsHydrated(true);
      setSyncStatus({
        state: "offline",
        pending: pendingRef.current,
        lastSyncedAt: null,
        lastError: err?.message || String(err),
      });
    }
  }, []);

  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      if (isVerifiedCurrentUser(user)) {
        void hydrate();
      } else {
        setIsHydrated(true);
        setSyncStatus((prev) => ({ ...prev, state: "idle", lastError: null }));
      }
    });
    const unsubscribe = subscribeToUIConfig(
      (moduleRecords) => {
        mergeRecords(moduleRecords);
        setSyncStatus((prev) => ({
          ...prev,
          state: prev.pending > 0 ? "saving" : "saved",
          lastSyncedAt: new Date().toISOString(),
          lastError: null,
        }));
      },
      (err) =>
        setSyncStatus((prev) => ({
          ...prev,
          state: "offline",
          lastError: err?.message || String(err),
        }))
    );
    return () => {
      unsubAuth();
      unsubscribe();
    };
  }, [hydrate]);

  /* ---------------- mutations (optimistic + rollback) ---------------- */

  const commitPatch = useCallback(
    async (elementKey: string, patch: UIConfigPatch, fallback?: string): Promise<boolean> => {
      const definition =
        registerRuntimeSlot(elementKey, fallback ?? "") ||
        ({
          element_key: elementKey,
          module: elementKey.split(".")[0] || "general",
          component_id: elementKey.split(".")[1] || "general",
          kind: "text",
          default_text: fallback ?? "",
        } as UICopySlotDefinition);

      const previous = getRecord(elementKey);
      const optimistic = previous
        ? applyPatch(previous, patch, "pending@local")
        : createRecord(definition, patch, "pending@local", 0);

      putRecord(optimistic); // optimistic paint
      markSaving();

      const result = await upsertUIConfigRecord(definition, patch, previous);
      if (result.success && result.record) {
        putRecord(result.record);
        markSettled(null);
        return true;
      }

      // Rollback to the last database-acknowledged state.
      if (previous) putRecord(previous);
      else dropRecord(elementKey);
      markSettled(result.error || "Unknown database error");
      return false;
    },
    [markSaving, markSettled]
  );

  const setText = useCallback(
    (elementKey: string, value: string, fallback?: string) =>
      commitPatch(elementKey, { text: value, label: value }, fallback),
    [commitPatch]
  );

  const updateSlot = useCallback(
    (elementKey: string, patch: UIConfigPatch, fallback?: string) =>
      commitPatch(elementKey, patch, fallback),
    [commitPatch]
  );

  const resetSlot = useCallback(
    async (elementKey: string): Promise<boolean> => {
      const definition = registerRuntimeSlot(elementKey, "");
      const previous = getRecord(elementKey);
      dropRecord(elementKey);
      markSaving();
      const result = await resetUIConfigRecord(definition, previous);
      if (result.success) {
        if (result.record) putRecord(result.record);
        markSettled(null);
        return true;
      }
      if (previous) putRecord(previous);
      markSettled(result.error || "Unknown database error");
      return false;
    },
    [markSaving, markSettled]
  );

  const commitBatch = useCallback(
    async (batch: UIConfigRecord[]): Promise<boolean> => {
      const previous = batch.map((r) => getRecord(r.element_key));
      batch.forEach((r) => putRecord(r));
      markSaving();
      const result = await bulkUpsertUIConfig(batch);
      if (result.success) {
        markSettled(null);
        return true;
      }
      batch.forEach((r, i) => {
        const prev = previous[i];
        if (prev) putRecord(prev);
        else dropRecord(r.element_key);
      });
      markSettled(result.error || "Unknown database error");
      return false;
    },
    [markSaving, markSettled]
  );

  const value = useMemo<UIConfigContextValue>(
    () => ({
      revision,
      records: getAllRecords(),
      syncStatus,
      kvStatus,
      isHydrated,
      resolve: (elementKey: string, fallback?: string) => resolveSlot(elementKey, fallback ?? ""),
      getRecordFor: (elementKey: string) => getRecord(elementKey),
      setText,
      updateSlot,
      resetSlot,
      commitBatch,
      reloadFromDatabase: hydrate,
      listSlots: getRuntimeSlots,
    }),
    [revision, syncStatus, kvStatus, isHydrated, setText, updateSlot, resetSlot, commitBatch, hydrate]
  );

  return <UIConfigContext.Provider value={value}>{children}</UIConfigContext.Provider>;
}

export function useUIConfigContext(): UIConfigContextValue {
  const ctx = useContext(UIConfigContext);
  if (!ctx) {
    throw new Error("useUIConfigContext must be used inside <UIConfigProvider>");
  }
  return ctx;
}

/** Non-throwing variant for components that may render outside the provider. */
export function useOptionalUIConfigContext(): UIConfigContextValue | undefined {
  return useContext(UIConfigContext);
}
