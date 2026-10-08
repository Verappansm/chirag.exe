import Link from "next/link";
import { getContent } from "@/lib/repo";
import { getStorage } from "@/lib/storage";

export const metadata = { title: "Admin" };

export default async function Dashboard() {
  const [t, s, tl, ty] = await Promise.all([getContent("trainees"), getContent("chirag-says"), getContent("timeline"), getContent("thank-you")]);
  const storage = getStorage();
  const cards = [
    { href: "/admin/trainees", label: "Who is this trainee", n: t.questions.length, goal: 23, unit: "questions" },
    { href: "/admin/chirag-says", label: "What would Chirag say", n: s.questions.length, unit: "questions" },
    { href: "/admin/timeline", label: "Meme timeline", n: tl.events.length, unit: "events" },
    { href: "/admin/thank-you", label: "Final thank you", n: ty.messages.length, goal: 23, unit: "messages" },
  ];
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {!storage.persistent && (
        <p className="mt-4 rounded-lg border border-bad/50 p-3 text-sm text-bad">
          ⚠ Storage is in-memory: edits will be lost. Connect Upstash Redis / Vercel KV (see README) before entering real content.
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card p-5 transition hover:border-mint/70">
            <p className="label">{c.label}</p>
            <p className="mt-2 text-4xl font-bold">{c.n}{c.goal && <span className="text-lg text-muted"> / {c.goal}</span>}</p>
            <p className="text-sm text-muted">{c.unit}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 font-mono text-xs text-muted">Storage: {storage.name}</p>
    </div>
  );
}
