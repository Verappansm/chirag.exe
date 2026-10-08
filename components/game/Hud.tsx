"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { levelFromXp, useGame } from "./GameProvider";
import { isMuted, setMuted } from "@/lib/sfx";

/** Top HUD: back to hub, XP bar, achievements count, sound toggle. */
export default function Hud({ title }: { title?: string }) {
  const { xp, awards } = useGame();
  const [muted, setM] = useState(false);
  useEffect(() => setM(isMuted()), []);
  const lvl = levelFromXp(xp);
  const pct = ((xp % 300) / 300) * 100;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link href="/hub" className="flex items-center gap-2 rounded-lg" aria-label="Back to game hub">
          <Avatar size={34} />
          <span className="hidden font-mono text-xs tracking-widest text-muted sm:inline">← HUB</span>
        </Link>
        {title && <span className="label hidden truncate md:inline">{title}</span>}
        <div className="ml-auto flex items-center gap-3">
          <div className="w-28 sm:w-44" title={`${xp} XP`}>
            <div className="mb-1 flex justify-between font-mono text-[10px] tracking-widest text-muted">
              <span>LVL {lvl}</span><span>{xp} XP</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-panel2">
              <div className="h-full rounded-full bg-mint transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="font-mono text-xs text-gold" title="Achievements">🏆 {awards.length}</span>
          <button
            className="rounded-md px-1 text-lg"
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            onClick={() => { setMuted(!muted); setM(!muted); }}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>
    </header>
  );
}
