/**
 * UI Config Repository
 * ====================
 * Per-user database access layer for the copy/layout registry owned by the
 * **Button & Layout Optimizer Studio**.
 *
 * Storage model (Firestore):
 *   ui_config_registry/{uid}_{module} → { module, ownerId, schema_version, records, updatedAt }
 *   ui_config_audit/{uid}_{auditId}   → append-only per-user change log
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  db,
  auth,
  waitForAuthReady,
  isVerifiedCurrentUser,
  userScopedId,
  subscribeToAuth,
  sanitizeForFirestore,
  handleFirestoreError,
  OperationType,
} from "./firebase";
import {
  UI_CONFIG_SCHEMA_VERSION,
  applyPatch,
  createRecord,
  moduleDocId,
  moduleOfKey,
  sanitizeRecordForPersistence,
  validateUIConfigRecord,
  type UIConfigDocument,
  type UIConfigPatch,
  type UIConfigRecord,
  type UICopySlotDefinition,
} from "../types/uiConfigSchema";

export const UI_CONFIG_COLLECTION = "ui_config_registry";
export const UI_CONFIG_AUDIT_COLLECTION = "ui_config_audit";

export interface UpsertResult {
  success: boolean;
  record?: UIConfigRecord;
  error?: string;
}

function currentAuthor(): string {
  return auth.currentUser?.email || auth.currentUser?.uid || "local_session";
}

/** Fetch every override document belonging to the signed-in user. */
export async function fetchAllUIConfig(): Promise<Record<string, UIConfigRecord>> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return {};
  }

  const result: Record<string, UIConfigRecord> = {};
  try {
    const q = query(collection(db, UI_CONFIG_COLLECTION), where("ownerId", "==", user.uid));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data() as UIConfigDocument | undefined;
      if (!data || !data.records) return;
      for (const [key, record] of Object.entries(data.records)) {
        if (record && typeof record === "object") result[key] = record as UIConfigRecord;
      }
    });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.LIST, UI_CONFIG_COLLECTION);
  }
  return result;
}

/** Fetch a single module document for the signed-in user. */
export async function fetchModuleUIConfig(module: string): Promise<Record<string, UIConfigRecord>> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return {};
  }

  const docId = userScopedId(user.uid, moduleDocId(module), 88);
  const path = `${UI_CONFIG_COLLECTION}/${docId}`;
  try {
    const snap = await getDoc(doc(db, UI_CONFIG_COLLECTION, docId));
    if (!snap.exists()) return {};
    const data = snap.data() as UIConfigDocument;
    return (data?.records as Record<string, UIConfigRecord>) || {};
  } catch (err: any) {
    try {
      handleFirestoreError(err, OperationType.GET, path);
    } catch {
      return {};
    }
  }
}

/** Live subscription across the signed-in user's registry slices. */
export function subscribeToUIConfig(
  onUpdate: (records: Record<string, UIConfigRecord>, meta: { module: string }) => void,
  onError?: (error: Error) => void
): () => void {
  let snapshotUnsub: (() => void) | null = null;
  let activeUid: string | null = null;

  const detach = () => {
    if (snapshotUnsub) {
      snapshotUnsub();
      snapshotUnsub = null;
    }
    activeUid = null;
  };

  const authUnsub = subscribeToAuth((user) => {
    if (!isVerifiedCurrentUser(user)) {
      detach();
      return;
    }
    if (activeUid === user.uid && snapshotUnsub) {
      return;
    }
    detach();
    activeUid = user.uid;
    try {
      const q = query(collection(db, UI_CONFIG_COLLECTION), where("ownerId", "==", user.uid));
      snapshotUnsub = onSnapshot(
        q,
        (snap) => {
          snap.docChanges().forEach((change) => {
            const data = change.doc.data() as UIConfigDocument | undefined;
            if (!data) return;
            onUpdate((data.records as Record<string, UIConfigRecord>) || {}, {
              module: data.module || change.doc.id,
            });
          });
        },
        (err) => {
          try {
            handleFirestoreError(err, OperationType.LIST, UI_CONFIG_COLLECTION);
          } catch (wrapped) {
            onError?.(wrapped as Error);
          }
        }
      );
    } catch (err: any) {
      onError?.(err);
    }
  });

  return () => {
    authUnsub();
    detach();
  };
}

/** Append-only audit trail entry for the signed-in user. */
async function writeAuditEntry(entry: {
  element_key: string;
  module: string;
  action: "upsert" | "reset" | "bulk_upsert";
  before?: UIConfigRecord | null;
  after?: UIConfigRecord | null;
  author: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) return;

  try {
    const slug = `${Date.now()}_${entry.element_key.replace(/[^a-zA-Z0-9_\-]/g, "_")}`.slice(0, 84);
    const docId = userScopedId(user.uid, slug, 84);
    await setDoc(doc(db, UI_CONFIG_AUDIT_COLLECTION, docId), {
      ownerId: user.uid,
      element_key: String(entry.element_key || "unknown").slice(0, 256),
      module: String(entry.module || "general").slice(0, 256),
      action: entry.action,
      author: String(entry.author || user.uid).slice(0, 256),
      payload: sanitizeForFirestore({
        before: entry.before ? sanitizeRecordForPersistence(entry.before) : null,
        after: entry.after ? sanitizeRecordForPersistence(entry.after) : null,
      }),
      schema_version: UI_CONFIG_SCHEMA_VERSION,
      createdAt: serverTimestamp(),
    });
  } catch (err: any) {
    console.warn("[uiConfigRepository] audit write skipped:", err?.message || err);
  }
}

/**
 * Create or update a single slot.
 * If the user is signed out, keeps the validated record in local memory for the session.
 */
export async function upsertUIConfigRecord(
  definition: UICopySlotDefinition,
  patch: UIConfigPatch,
  existing?: UIConfigRecord
): Promise<UpsertResult> {
  const author = currentAuthor();
  const module = moduleDocId(definition.module || moduleOfKey(definition.element_key)).slice(0, 88);
  const next = existing
    ? applyPatch({ ...existing, module }, patch, author)
    : createRecord({ ...definition, module }, patch, author, 0);

  const validation = validateUIConfigRecord(next);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") };
  }

  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return { success: true, record: next };
  }

  const docId = userScopedId(user.uid, module, 88);
  const path = `${UI_CONFIG_COLLECTION}/${docId}`;
  try {
    const ref = doc(db, UI_CONFIG_COLLECTION, docId);
    const prevSnap = await getDoc(ref);
    const prevRecords = prevSnap.exists()
      ? ((prevSnap.data() as UIConfigDocument | undefined)?.records || {})
      : {};
    const mergedRecords = {
      ...prevRecords,
      [next.element_key]: sanitizeForFirestore(sanitizeRecordForPersistence(next)),
    };
    const boundedRecords =
      Object.keys(mergedRecords).length <= 5000
        ? mergedRecords
        : Object.fromEntries(Object.entries(mergedRecords).slice(0, 5000));
    await setDoc(ref, {
      module,
      ownerId: user.uid,
      schema_version: UI_CONFIG_SCHEMA_VERSION,
      records: boundedRecords,
      updatedAt: serverTimestamp(),
    });
    void writeAuditEntry({
      element_key: next.element_key,
      module,
      action: "upsert",
      before: existing || null,
      after: next,
      author,
    });
    return { success: true, record: next };
  } catch (err: any) {
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch (wrapped: any) {
      return { success: false, error: wrapped?.message || String(err) };
    }
  }
}

/** Commit many slots at once (studio "commit all" / import flows). */
export async function bulkUpsertUIConfig(records: UIConfigRecord[]): Promise<UpsertResult> {
  if (!records.length) return { success: true };
  const author = currentAuthor();
  const byModule = new Map<string, Record<string, UIConfigRecord>>();

  for (const record of records) {
    const validation = validateUIConfigRecord(record);
    if (!validation.valid) {
      return { success: false, error: `${record.element_key}: ${validation.errors.join("; ")}` };
    }
    const module = moduleDocId(record.module || moduleOfKey(record.element_key)).slice(0, 88);
    if (!byModule.has(module)) byModule.set(module, {});
    byModule.get(module)![record.element_key] = sanitizeForFirestore(
      sanitizeRecordForPersistence({ ...record, module })
    );
  }

  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return { success: true };
  }

  try {
    await Promise.all(
      Array.from(byModule.entries()).map(async ([module, moduleRecords]) => {
        const docId = userScopedId(user.uid, module, 88);
        const ref = doc(db, UI_CONFIG_COLLECTION, docId);
        const prevSnap = await getDoc(ref);
        const prevRecords = prevSnap.exists()
          ? ((prevSnap.data() as UIConfigDocument | undefined)?.records || {})
          : {};
        const mergedRecords = { ...prevRecords, ...moduleRecords };
        const boundedRecords =
          Object.keys(mergedRecords).length <= 5000
            ? mergedRecords
            : Object.fromEntries(Object.entries(mergedRecords).slice(0, 5000));
        await setDoc(ref, {
          module,
          ownerId: user.uid,
          schema_version: UI_CONFIG_SCHEMA_VERSION,
          records: boundedRecords,
          updatedAt: serverTimestamp(),
        });
      })
    );
    void writeAuditEntry({
      element_key: `bulk_${records.length}_records`,
      module: Array.from(byModule.keys()).join(",").slice(0, 256),
      action: "bulk_upsert",
      author,
    });
    return { success: true };
  } catch (err: any) {
    try {
      handleFirestoreError(err, OperationType.WRITE, UI_CONFIG_COLLECTION);
    } catch (wrapped: any) {
      return { success: false, error: wrapped?.message || String(err) };
    }
  }
}

/** Reset a slot back to its registry default. */
export async function resetUIConfigRecord(
  definition: UICopySlotDefinition,
  existing?: UIConfigRecord
): Promise<UpsertResult> {
  const author = currentAuthor();
  const module = moduleDocId(definition.module || moduleOfKey(definition.element_key)).slice(0, 88);
  const cleared: UIConfigRecord = sanitizeRecordForPersistence({
    element_key: definition.element_key,
    component_id: definition.component_id,
    module,
    kind: definition.kind,
    default_text: definition.default_text,
    source_file: definition.source_file,
    source_line: definition.source_line,
    numeric_component_id: definition.numeric_component_id,
    element_type: definition.element_type,
    parent_section: definition.parent_section,
    last_updated_at: new Date().toISOString(),
    last_updated_by: author,
    revision: (existing?.revision || 0) + 1,
    schema_version: UI_CONFIG_SCHEMA_VERSION,
  });

  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return { success: true, record: cleared };
  }

  const docId = userScopedId(user.uid, module, 88);
  const path = `${UI_CONFIG_COLLECTION}/${docId}`;
  try {
    const ref = doc(db, UI_CONFIG_COLLECTION, docId);
    const prevSnap = await getDoc(ref);
    const prevRecords = prevSnap.exists()
      ? ((prevSnap.data() as UIConfigDocument | undefined)?.records || {})
      : {};
    const mergedRecords = {
      ...prevRecords,
      [definition.element_key]: sanitizeForFirestore(cleared),
    };
    const boundedRecords =
      Object.keys(mergedRecords).length <= 5000
        ? mergedRecords
        : Object.fromEntries(Object.entries(mergedRecords).slice(0, 5000));
    await setDoc(ref, {
      module,
      ownerId: user.uid,
      schema_version: UI_CONFIG_SCHEMA_VERSION,
      records: boundedRecords,
      updatedAt: serverTimestamp(),
    });
    void writeAuditEntry({
      element_key: definition.element_key,
      module,
      action: "reset",
      before: existing || null,
      after: cleared,
      author,
    });
    return { success: true, record: cleared };
  } catch (err: any) {
    try {
      handleFirestoreError(err, OperationType.WRITE, path);
    } catch (wrapped: any) {
      return { success: false, error: wrapped?.message || String(err) };
    }
  }
}

/** Recent audit entries for the signed-in user. */
export async function fetchRecentAuditEntries(limit = 50): Promise<any[]> {
  await waitForAuthReady();
  const user = auth.currentUser;
  if (!isVerifiedCurrentUser(user)) {
    return [];
  }

  try {
    const q = query(collection(db, UI_CONFIG_AUDIT_COLLECTION), where("ownerId", "==", user.uid));
    const snap = await getDocs(q);
    const rows: any[] = [];
    snap.forEach((d) => {
      const data = d.data();
      const ts =
        data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate().toISOString()
          : data.timestamp || "";
      rows.push({
        id: d.id,
        ...data,
        before: data.payload?.before ?? data.before ?? null,
        after: data.payload?.after ?? data.after ?? null,
        timestamp: ts,
      });
    });
    rows.sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
    return rows.slice(0, limit);
  } catch (err: any) {
    try {
      handleFirestoreError(err, OperationType.LIST, UI_CONFIG_AUDIT_COLLECTION);
    } catch {
      return [];
    }
  }
}
