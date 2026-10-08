import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { title: "Who is this trainee", kind: "trainees", list: "Questions", add: "Add question" },
  { title: "What would Chirag say", kind: "chirag-says", list: "Questions", add: "Add question" },
  { title: "Meme timeline", kind: "timeline", list: "Events", add: "Add event" },
  { title: "Final thank you", kind: "thank-you", list: "Messages", add: "Add message" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:sticky md:top-6 md:h-fit md:w-56 md:shrink-0">
        <nav aria-label="Admin" className="card space-y-4 p-4 text-sm">
          <Link href="/admin" className="block font-bold text-mint">DASHBOARD</Link>
          {NAV.map((n) => (
            <div key={n.kind}>
              <p className="label mb-1">{n.title}</p>
              <Link className="block py-0.5 text-muted hover:text-text" href={`/admin/${n.kind}`}>– {n.list}</Link>
              <Link className="block py-0.5 text-muted hover:text-text" href={`/admin/${n.kind}?new=1`}>– {n.add}</Link>
            </div>
          ))}
          <Link href="/admin/settings" className="block font-bold">SETTINGS</Link>
          <Link href="/hub" target="_blank" className="block text-xs text-muted hover:text-text">Open the game ↗</Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
