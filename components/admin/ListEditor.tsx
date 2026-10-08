"use client";
// Generic add / edit / delete / reorder / enable editor for any content list.
// Each section supplies: blank item, summary line, form, and (optionally) a preview renderer.
//
// Concurrency model: every save sends ONE item (or one delete / reorder) to the server, which applies it
// on top of the latest data. The response is merged into the screen, keeping this tab's unsaved cards.
// So several admins can edit at the same time without overwriting each other.
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ContentKind } from "@/lib/types";

type Item = { id: string; enabled: boolean };

export interface EditorConfig<D, T extends Item> {
  kind: ContentKind;
  listKey: keyof D & string;
  noun: string; // "Question" | "Event" | "Message"
  blank: (n: number) => T;
  summary: (item: T) => string;
  Form: React.ComponentType<{ item: T; onChange: (patch: Partial<T>) => void }>;
  Preview?: React.ComponentType<{ item: T }>;
  Header?: React.ComponentType<{ data: D; setData: (d: D) => void }>;
}

const newId = (base: string) => `${base.replace(/-[a-z0-9]*$/, "")}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export default function ListEditor<D extends object, T extends Item>({
  config, initial,
}: { config: EditorConfig<D, T>; initial: D }) {
  const { kind, listKey, noun, blank, summary, Form, Preview, Header } = config;
  const api = `/api/admin/content/${kind}`;

  const [data, setData] = useState<D>(initial);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [linesDirty, setLinesDirty] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [preview, setPreview] = useState<T | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const wantNew = useSearchParams().get("new");

  // Refs let async callbacks see the latest state.
  const dataRef = useRef(data);
  const dirtyRef = useRef(dirtyIds);
  const linesDirtyRef = useRef(linesDirty);
  dataRef.current = data;
  dirtyRef.current = dirtyIds;
  linesDirtyRef.current = linesDirty;

  const listOf = (d: D) => d[listKey] as unknown as T[];
  const items = listOf(data);
  const anyDirty = dirtyIds.size > 0 || linesDirty;

  const markDirty = (id: string) => setDirtyIds((s) => new Set(s).add(id));
  const clearDirty = (id: string) => setDirtyIds((s) => { const n = new Set(s); n.delete(id); return n; });

  /** Merge a fresh server copy into what's on screen: server wins, except for this tab's unsaved cards. */
  const merge = useCallback((server: D) => {
    const local = listOf(dataRef.current);
    const dirty = dirtyRef.current;
    const localById = new Map(local.map((i) => [i.id, i]));
    const serverIds = new Set(listOf(server).map((i) => i.id));
    const merged = listOf(server).map((s) => (dirty.has(s.id) && localById.has(s.id) ? localById.get(s.id)! : s));
    for (const l of local) if (!serverIds.has(l.id) && dirty.has(l.id)) merged.push(l); // my unsaved new cards
    const next = { ...server, [listKey]: merged } as D;
    if (linesDirtyRef.current && "lines" in (dataRef.current as object)) {
      (next as Record<string, unknown>).lines = (dataRef.current as Record<string, unknown>).lines;
    }
    dataRef.current = next;
    setData(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  const call = async (init: RequestInit) => {
    const res = await fetch(api, { ...init, headers: { "Content-Type": "application/json" } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Request failed");
    return body as D;
  };
  const patch = (payload: object) => call({ method: "PATCH", body: JSON.stringify(payload) });

  const refresh = useCallback(async () => {
    try { merge(await call({ method: "GET" })); } catch { /* keep what's on screen */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merge]);

  // Pick up other people's changes: when the tab regains focus, and every 30s if nothing is unsaved.
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible" && !saving) void refresh(); };
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(() => { if (!saving && !anyDirty) void refresh(); }, 30000);
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(t); };
  }, [refresh, saving, anyDirty]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (anyDirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);

  const setItems = (next: T[]) => setData({ ...dataRef.current, [listKey]: next } as D);

  const add = useCallback(() => {
    const item = blank(listOf(dataRef.current).length + 1);
    item.id = newId(item.id);
    dataRef.current = { ...dataRef.current, [listKey]: [...listOf(dataRef.current), item] } as D;
    setData(dataRef.current);
    markDirty(item.id);
    setOpen(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blank, listKey]);

  // "Add …" links in the sidebar open a blank card once.
  useEffect(() => {
    if (wantNew) {
      add();
      window.history.replaceState(null, "", `/admin/${kind}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantNew]);

  const edit = (idx: number, p: Partial<T>) => {
    const it = items[idx];
    setItems(items.map((x, k) => (k === idx ? { ...x, ...p } : x)));
    markDirty(it.id);
    setStatus(null);
  };

  const move = async (idx: number, d: number) => {
    const j = idx + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
    try { merge(await patch({ op: "order", ids: next.map((i) => i.id) })); }
    catch (e) { setStatus({ ok: false, text: e instanceof Error ? e.message : "Reorder failed" }); }
  };

  const remove = async (idx: number) => {
    const it = items[idx];
    if (!confirm(`Delete this ${noun.toLowerCase()}?`)) return;
    setItems(items.filter((_, k) => k !== idx));
    clearDirty(it.id);
    dirtyRef.current = new Set([...dirtyRef.current].filter((x) => x !== it.id));
    try { merge(await patch({ op: "delete", id: it.id })); setStatus({ ok: true, text: "Deleted ✓" }); }
    catch (e) { setStatus({ ok: false, text: e instanceof Error ? e.message : "Delete failed" }); }
  };

  const saveOne = async (id: string) => {
    const item = listOf(dataRef.current).find((i) => i.id === id);
    if (!item) return;
    const server = await patch({ op: "upsert", item });
    dirtyRef.current = new Set([...dirtyRef.current].filter((x) => x !== id)); // clear first so the server's cleaned copy wins
    clearDirty(id);
    merge(server);
  };

  const run = async (ids: string[], withLines: boolean) => {
    setSaving(true);
    setStatus(null);
    const failures: string[] = [];
    for (const id of ids) {
      try { await saveOne(id); }
      catch (e) { failures.push(e instanceof Error ? e.message : "Save failed"); }
    }
    if (withLines) {
      try {
        merge(await patch({ op: "lines", lines: (dataRef.current as unknown as { lines: string[] }).lines }));
        linesDirtyRef.current = false;
        setLinesDirty(false);
      } catch (e) { failures.push(e instanceof Error ? e.message : "Lines failed"); }
    }
    setSaving(false);
    setStatus(failures.length
      ? { ok: false, text: failures[0] + (failures.length > 1 ? ` (+${failures.length - 1} more)` : "") }
      : { ok: true, text: "Saved ✓ — live on the public game now." });
  };

  return (
    <div>
      {Header && (
        <Header
          data={data}
          setData={(d) => { setData(d); dataRef.current = d; linesDirtyRef.current = true; setLinesDirty(true); }}
        />
      )}

      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <button className="btn" onClick={add}>+ Add {noun.toLowerCase()}</button>
        <button className="btn btn-primary" onClick={() => run([...dirtyIds], linesDirty)} disabled={saving || !anyDirty}>
          {saving ? "Saving…" : `Save all${anyDirty ? ` (${dirtyIds.size + (linesDirty ? 1 : 0)})` : ""}`}
        </button>
        <button className="btn" onClick={() => void refresh()} disabled={saving}>↻ Refresh</button>
        <span className="font-mono text-xs text-muted">{items.length} total · {items.filter((i) => i.enabled).length} enabled</span>
        {status && <span role="status" className={`text-sm ${status.ok ? "text-mint" : "text-bad"}`}>{status.text}</span>}
      </div>

      <ol className="space-y-3">
        {items.map((it, idx) => {
          const isOpen = open === it.id;
          const isDirty = dirtyIds.has(it.id);
          return (
            <li key={it.id} className={`card ${it.enabled ? "" : "opacity-60"} ${isDirty ? "border-gold/60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 p-3">
                <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpen(isOpen ? null : it.id)} aria-expanded={isOpen}>
                  <span className="label shrink-0">{noun} #{String(idx + 1).padStart(2, "0")}</span>
                  <span className="truncate">{summary(it) || <em className="text-muted">empty</em>}</span>
                  {isDirty && <span className="shrink-0 font-mono text-[10px] tracking-widest text-gold">● UNSAVED</span>}
                </button>
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" checked={it.enabled} onChange={(e) => edit(idx, { enabled: e.target.checked } as Partial<T>)} /> enabled
                </label>
                <button className="btn !px-2.5 !py-1.5" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up">↑</button>
                <button className="btn !px-2.5 !py-1.5" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Move down">↓</button>
                {Preview && <button className="btn !px-3 !py-1.5" onClick={() => setPreview(it)}>Preview</button>}
                <button className="btn btn-danger !px-3 !py-1.5" onClick={() => remove(idx)}>Delete</button>
              </div>
              {isOpen && (
                <div className="space-y-4 border-t border-line p-4">
                  <Form item={it} onChange={(p) => edit(idx, p)} />
                  <button className="btn btn-primary" onClick={() => run([it.id], false)} disabled={saving || !isDirty}>
                    {saving ? "Saving…" : "Save this " + noun.toLowerCase()}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!items.length && <p className="card p-6 text-muted">Nothing here yet. Click “Add {noun.toLowerCase()}”.</p>}

      {preview && Preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Preview">
          <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-ink p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="label !text-gold">Preview · nothing is saved or scored</span>
              <button className="btn !py-1.5" onClick={() => setPreview(null)}>Close ✕</button>
            </div>
            <Preview item={preview} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- small form helpers ---------- */
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
export function Text({ label, value, onChange, hint, placeholder, area }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; area?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      {area ? (
        <textarea className="input" rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}
