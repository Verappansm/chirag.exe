"use client";
// Level select. To add a new game: add an entry to LEVELS and create app/games/<slug>/page.tsx.
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import Hud from "./Hud";
import { LevelId, useGame } from "./GameProvider";
import { play } from "@/lib/sfx";

interface Level { n: string; id: LevelId; href: string; title: string; blurb: string; icon: string }
export const LEVELS: Level[] = [
  { n: "01", id: "trainee", href: "/games/trainee", title: "WHO IS THIS TRAINEE?", blurb: "Clues. Suspects. Zero mercy.", icon: "🕵️" },
  { n: "02", id: "says", href: "/games/chirag-says", title: "WHAT WOULD CHIRAG SAY?", blurb: "Read the room. Predict the reply.", icon: "🗣️" },
  { n: "03", id: "timeline", href: "/games/timeline", title: "THE TRAINING MEME TIMELINE", blurb: "3 months. 23 engineers. Several incidents.", icon: "🎬" },
];

export default function Hub() {
  const { done, cheat, enableCheat, awards, xp } = useGame();
  const [taps, setTaps] = useState(0);
  const allDone = LEVELS.every((l) => done.includes(l.id));
  const finaleOpen = allDone || cheat;

  return (
    <>
      <Hud title="Game hub" />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="label">Select level</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">The Training Simulator</h1>
        <p className="mt-2 text-muted">{done.length}/3 levels cleared · {awards.length} achievements · {xp} XP</p>

        <ol className="mt-8 grid gap-4">
          {LEVELS.map((l, i) => (
            <motion.li key={l.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link href={l.href} onClick={() => play("click")} className="card group flex items-center gap-4 p-5 transition hover:border-mint/70 hover:bg-panel2">
                <span className="text-3xl" aria-hidden>{l.icon}</span>
                <span className="flex-1">
                  <span className="label block">Level {l.n}</span>
                  <span className="block text-lg font-bold sm:text-xl">{l.title}</span>
                  <span className="block text-sm text-muted">{l.blurb}</span>
                </span>
                {done.includes(l.id) ? (
                  <span className="font-mono text-xs text-mint">✓ CLEARED</span>
                ) : (
                  <span className="font-mono text-xl text-muted transition group-hover:translate-x-1 group-hover:text-mint">▶</span>
                )}
              </Link>
            </motion.li>
          ))}

          <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {finaleOpen ? (
              <Link href="/finale" onClick={() => play("click")} className="card flex items-center gap-4 border-gold/60 p-5 transition hover:bg-panel2">
                <span className="text-3xl" aria-hidden>🏁</span>
                <span className="flex-1">
                  <span className="label !text-gold block">Final level</span>
                  <span className="block text-lg font-bold sm:text-xl">GAME COMPLETE</span>
                  <span className="block text-sm text-muted">{cheat && !allDone ? "Unlocked with a cheat code. We saw that." : "You made it."}</span>
                </span>
                <span className="font-mono text-xl text-gold">▶</span>
              </Link>
            ) : (
              <button
                className="card flex w-full items-center gap-4 p-5 text-left opacity-70"
                onClick={() => {
                  play("wrong");
                  if (taps + 1 >= 5) enableCheat();
                  setTaps(taps + 1);
                }}
                aria-label="Locked. Clear all three levels to unlock."
              >
                <span className="text-3xl" aria-hidden>🔒</span>
                <span className="flex-1">
                  <span className="label block">Final level · locked</span>
                  <span className="block text-lg font-bold">???</span>
                  <span className="block text-sm text-muted">
                    {taps >= 2 && taps < 5 ? `Impatient? Keep tapping… (${5 - taps})` : "Clear all three levels to unlock."}
                  </span>
                </span>
              </button>
            )}
          </motion.li>
        </ol>
      </main>
    </>
  );
}
