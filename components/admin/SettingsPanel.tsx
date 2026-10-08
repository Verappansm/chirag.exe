"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONTENT_KINDS } from "@/lib/types";

export default function SettingsPanel({ storage, persistent }: { storage: string; persistent: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };
  const reset = async (kind: string) => {
    if (!confirm(`Reset "${kind}" to the original seed data? Your edits will be lost.`)) return;
    const res = await fetch(`/api/admin/content/${kind}`, { method: "DELETE" });
    setMsg(res.ok ? `Reset ${kind}.` : "Reset failed");
  };
  const exportAll = async () => {
    const out: Record<string, unknown> = {};
    for (const k of CONTENT_KINDS) out[k] = await (await fetch(`/api/admin/content/${k}`)).json();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    a.download = "chirag-game-backup.json";
    a.click();
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <p className="label">Storage</p>
        <p className="mt-1">{storage}</p>
        {!persistent && <p className="mt-1 text-sm text-bad">Not persistent. Configure Upstash Redis / Vercel KV.</p>}
      </section>
      <section className="card space-y-3 p-5">
        <p className="label">Backup</p>
        <button className="btn" onClick={exportAll}>Download all content (JSON)</button>
      </section>
      <section className="card space-y-3 p-5">
        <p className="label">Reset a section to seed data</p>
        <div className="flex flex-wrap gap-2">
          {CONTENT_KINDS.map((k) => <button key={k} className="btn btn-danger" onClick={() => reset(k)}>{k}</button>)}
        </div>
        {msg && <p role="status" className="text-sm text-mint">{msg}</p>}
      </section>
      <button className="btn" onClick={logout}>Log out</button>
    </div>
  );
}
