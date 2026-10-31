/** Named workspaces are stored locally so large image data is not limited by
 * localStorage or Firestore document sizes. They are independent of defaults. */
export interface NamedWorkspaceState<T> {
  name: string;
  savedAt: string;
  state: T;
}

const DB_NAME = "SeqCarverNamedWorkspaces";
const STORE = "states";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "name" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open saved states"));
    request.onblocked = () => reject(new Error("Saved states database is blocked by another tab"));
  });
}

async function transact<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Saved states storage failed")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Saved states storage was aborted")); };
  });
}

export async function listNamedStates<T>(): Promise<NamedWorkspaceState<T>[]> {
  const states = await transact<NamedWorkspaceState<T>[]>("readonly", (store) => store.getAll());
  return states.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function saveNamedState<T>(name: string, state: T): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Enter a name for this state.");
  await transact("readwrite", (store) => store.put({ name: trimmed, savedAt: new Date().toISOString(), state }));
}

export async function deleteNamedState(name: string): Promise<void> {
  await transact("readwrite", (store) => store.delete(name));
}
