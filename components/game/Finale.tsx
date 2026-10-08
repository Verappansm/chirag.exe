"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import Media from "@/components/ui/Media";
import Confetti from "@/components/animations/Confetti";
import { play } from "@/lib/sfx";
import type { ThankYouData } from "@/lib/types";

const STATS = ["23 TRAINEES", "3 MONTHS", "COUNTLESS QUESTIONS", "COUNTLESS BUGS", "A LOT OF MEMES"];
type Phase = "stats" | "pause" | "thanks";
const isVideo = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u);

export default function Finale({ data }: { data: ThankYouData }) {
  const [phase, setPhase] = useState<Phase>("stats");
  const [n, setN] = useState(0);
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (phase !== "stats") return;
    if (n < STATS.length) {
      const t = setTimeout(() => { play("click"); setN(n + 1); }, 750);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase("pause"), 1800);
    return () => clearTimeout(t);
  }, [phase, n]);

  useEffect(() => {
    if (phase !== "pause") return;
    const t = setTimeout(() => setPhase("thanks"), 3200);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "thanks" || line >= data.lines.length) return;
    const t = setTimeout(() => setLine(line + 1), line === 0 ? 1200 : 2000);
    return () => clearTimeout(t);
  }, [phase, line, data.lines.length]);

  const finished = line >= data.lines.length;

  if (phase !== "thanks") {
    return (
      <main className="relative flex min-h-dvh items-center justify-center px-5 text-center">
        <AnimatePresence mode="wait">
          {phase === "stats" ? (
            <motion.div key="stats" exit={{ opacity: 0 }} transition={{ duration: 1 }}>
              <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl font-black tracking-tight text-gold sm:text-6xl">
                GAME COMPLETE
              </motion.h1>
              {n >= 1 && <Confetti count={50} />}
              <ul className="mt-8 space-y-2 font-mono text-sm tracking-[0.2em] sm:text-lg">
                {STATS.slice(0, n).map((s) => (
                  <motion.li key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{s}</motion.li>
                ))}
              </ul>
              <button className="mt-8 text-xs text-muted underline" onClick={() => setPhase("thanks")}>skip</button>
            </motion.div>
          ) : (
            <motion.p key="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="text-2xl text-muted sm:text-3xl">
              But jokes aside...
            </motion.p>
          )}
        </AnimatePresence>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <div className="text-center">
        <div className="mb-8 flex justify-center"><Avatar size={96} /></div>
        <div aria-live="polite" className="space-y-4">
          {data.lines.slice(0, line + (line < data.lines.length ? 1 : 0)).map((l, k) => (
            <motion.p
              key={k}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className={k === 0 ? "text-4xl font-bold sm:text-5xl" : "text-lg text-muted sm:text-xl"}
            >
              {l}
            </motion.p>
          ))}
        </div>
        {finished && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="mt-10 text-xl text-mint">
            From your 23 trainees ❤️
          </motion.p>
        )}
        {!finished && (
          <button className="mt-8 text-xs text-muted underline" onClick={() => setLine(data.lines.length)}>skip</button>
        )}
      </div>

      {finished && data.messages.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1.5 }} className="mt-16" aria-label="Messages from the trainees">
          <p className="label mb-4 text-center">Messages</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.messages.map((m) => (
              <li key={m.id} className="card overflow-hidden">
                {m.mediaUrl && (isVideo(m.mediaUrl) ? (
                  <Media url={m.mediaUrl} controls className="w-full" />
                ) : (
                  <Media url={m.mediaUrl} alt={`From ${m.name}`} className="max-h-72 w-full !rounded-none object-cover" />
                ))}
                <div className="p-4">
                  {m.message && <p className="whitespace-pre-line">{m.message}</p>}
                  <p className="mt-2 font-mono text-xs tracking-widest text-mint">— {m.name}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      )}
      {finished && <div className="mt-12 text-center"><Link href="/hub" className="text-xs text-muted underline">back to hub</Link></div>}
    </main>
  );
}
