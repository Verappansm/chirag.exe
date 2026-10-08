"use client";
// Generic add / edit / delete / reorder / enable editor for any content list.
// Each section supplies: blank item, summary line, form, and (optionally) a preview renderer.
import { useEffect, useState } from "react";
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

export default function ListEditor<D extends object, T extends Item>({
  config, initial,
}: { config: EditorConfig<D, T>; initial: D }) {
  const { kind, listKey, noun, blank, summary, Form, Preview, Header } = config;
  const [data, setData] = useState<D>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [preview, setPreview] = useState<T | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const wantNew = useSearchParams().get("new");

  const items = data[listKey] as unknown as T[];
  const setItems = (next: T[]) => { setData({ ...data, [listKey]: next } as D); setDirty(true); setStatus(null); };

  const add = () => {
    const item = blank(items.length + 1);
    item.id = `${item.id.replace(/-\d+$/, "")}-${Date.now().toString(36)}`;
    setItems([...items, item]);
    setOpen(item.id);
  };
  // "Add …" links in the sidebar open a blank card once.
  useEffect(() => {
    if (wantNew) {
      const item = blank(items.length + 1);
      item.id = `${item.id.replace(/-\d+$/, "")}-${Date.now().toString(36)}`;
      setData((d) => ({ ...d, [listKey]: [...(d[listKey] as unknown as T[]), item] }) as D);
      setOpen(item.id);
      setDirty(true);
      window.history.replaceState(null, "", `/admin/${kind}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantNew]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = (idx: number, p: Partial<T>) => setItems(items.map((it, k) => (k === idx ? { ...it, ...p } : it)));
  const move = (idx: number, d: number) => {
    const j = idx + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
  };
  const remove = (idx: number) => {
    if (!confirm(`Delete this ${noun.toLowerCase()}?`)) return;
    setItems(items.filter((_, k) => k !== idx));
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/content/${kind}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Save failed");
      setData(body);
      setDirty(false);
      setStatus({ ok: true, text: "Saved ✓ — live on the public game now." });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {Header && <Header data={data} setData={(d) => { setData(d); setDirty(true); }} />}

      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <button className="btn" onClick={add}>+ Add {noun.toLowerCase()}</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? "Saving…" : "Save all"}</button>
        <span className="font-mono text-xs text-muted">{items.length} total · {items.filter((i) => i.enabled).length} enabled{dirty && " · unsaved changes"}</span>
        {status && <span role="status" className={`text-sm ${status.ok ? "text-mint" : "text-bad"}`}>{status.text}</span>}
      </div>

      <ol className="space-y-3">
        {items.map((it, idx) => {
          const isOpen = open === it.id;
          return (
            <li key={it.id} className={`card ${it.enabled ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-2 p-3">
                <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpen(isOpen ? null : it.id)} aria-expanded={isOpen}>
                  <span className="label shrink-0">{noun} #{String(idx + 1).padStart(2, "0")}</span>
                  <span className="truncate">{summary(it) || <em className="text-muted">empty</em>}</span>
                </button>
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" checked={it.enabled} onChange={(e) => patch(idx, { enabled: e.target.checked } as Partial<T>)} /> enabled
                </label>
                <button className="btn !px-2.5 !py-1.5" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up">↑</button>
                <button className="btn !px-2.5 !py-1.5" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Move down">↓</button>
                {Preview && <button className="btn !px-3 !py-1.5" onClick={() => setPreview(it)}>Preview</button>}
                <button className="btn btn-danger !px-3 !py-1.5" onClick={() => remove(idx)}>Delete</button>
              </div>
              {isOpen && (
                <div className="space-y-4 border-t border-line p-4">
                  <Form item={it} onChange={(p) => patch(idx, p)} />
                  <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? "Saving…" : "Save"}</button>
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
