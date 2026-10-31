import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { deleteNamedState, listNamedStates, saveNamedState, type NamedWorkspaceState } from "../utils/namedWorkspaceStates";

interface Props<T> {
  capture: () => T;
  restore: (state: T) => void | Promise<void>;
  onClose: () => void;
  onExit: () => void;
}

export function NamedWorkspaceDialog<T>({ capture, restore, onClose, onExit }: Props<T>) {
  const [name, setName] = useState("");
  const [states, setStates] = useState<NamedWorkspaceState<T>[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let active = true;
    listNamedStates<T>().then((items) => { if (active) { setStates(items); setStorageReady(true); } })
      .catch((err) => { if (active) setError(err.message || "Could not load saved states."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Enter a name for this state."); return; }
    if (states.some((item) => item.name === trimmed) && !window.confirm(`Replace the saved state “${trimmed}”?`)) return;
    setBusy(true); setError("");
    try {
      await saveNamedState(trimmed, capture());
      onExit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this state.");
      setBusy(false);
    }
  };

  const handleRestore = async (item: NamedWorkspaceState<T>) => {
    if (!window.confirm(`Recall “${item.name}”? This replaces the current button, header, front-page and sequence settings.`)) return;
    setBusy(true); setError("");
    try { await restore(item.state); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not recall this state."); setBusy(false); }
  };
  const handleDelete = async (item: NamedWorkspaceState<T>) => {
    if (!window.confirm(`Delete the saved state “${item.name}”?`)) return;
    setBusy(true); setError("");
    try { await deleteNamedState(item.name); setStates((prev) => prev.filter((s) => s.name !== item.name)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete this state."); }
    finally { setBusy(false); }
  };

  return createPortal(
    <div data-utility-modal="true" className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <section role="dialog" aria-modal="true" aria-labelledby="named-state-title" className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl border border-sky-500/40 bg-slate-900 p-5 text-slate-100 shadow-2xl" onKeyDown={(e) => { if (e.key === "Escape" && !busy) onClose(); }}>
        <div className="flex items-center justify-between gap-4">
          <h2 id="named-state-title" className="text-base font-bold">Save &amp; recall workspace</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close saved states" className="rounded p-1 text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">Save button and header customizations, logo, front-page images and sequence settings. Saved states stay in this browser on this device.</p>
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-2">
          <label htmlFor="named-state-name" className="text-xs font-semibold text-slate-300">State name</label>
          <input id="named-state-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. My workspace" className="rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-400" />
          <button disabled={busy || loading || !storageReady} type="submit" className="rounded-md bg-sky-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-sky-400 disabled:opacity-50">Save named state &amp; exit</button>
        </form>
        {error && <p role="alert" className="mt-3 text-xs text-rose-400">{error}</p>}
        <h3 className="mt-5 mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Saved states</h3>
        {loading ? <p className="text-xs text-slate-500">Loading saved states…</p> : states.length === 0 ? <p className="text-xs text-slate-500">No saved states yet.</p> : (
          <ul className="space-y-2">{states.map((item) => (
            <li key={item.name} className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/70 p-2">
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold" title={item.name}>{item.name}</div><div className="text-[11px] text-slate-400">{new Date(item.savedAt).toLocaleString()}</div></div>
              <button type="button" disabled={busy} onClick={() => void handleRestore(item)} className="rounded bg-sky-500/20 px-2 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 disabled:opacity-50">Recall</button>
              <button type="button" disabled={busy} onClick={() => void handleDelete(item)} aria-label={`Delete ${item.name}`} className="rounded p-1 text-slate-400 hover:text-rose-400 disabled:opacity-50"><Trash2 size={15} /></button>
            </li>
          ))}</ul>
        )}
        <button type="button" disabled={busy} onClick={onExit} className="mt-5 text-xs text-slate-400 underline hover:text-white">Exit without saving</button>
      </section>
    </div>, document.body,
  );
}
