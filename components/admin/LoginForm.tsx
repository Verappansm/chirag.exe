"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) { router.replace("/admin"); router.refresh(); return; }
    setErr((await res.json().catch(() => ({}))).error || "Login failed");
    setPin("");
    setBusy(false);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <p className="label">Admin</p>
        <h1 className="text-2xl font-bold">Enter PIN</h1>
        {!configured && <p className="rounded-lg border border-bad/50 p-3 text-sm text-bad">ADMIN_PIN_HASH is not set. See README.</p>}
        <input
          className="input text-center font-mono text-2xl tracking-[0.5em]"
          inputMode="numeric" pattern="\d{6}" maxLength={6} autoFocus autoComplete="off"
          aria-label="6-digit PIN" placeholder="••••••" value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <button className="btn btn-primary w-full" disabled={pin.length !== 6 || busy}>{busy ? "Checking…" : "Unlock"}</button>
      </form>
    </main>
  );
}
