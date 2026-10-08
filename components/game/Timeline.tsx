"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Media from "@/components/ui/Media";
import Certificate from "@/components/ui/Certificate";
import { useGame } from "./GameProvider";
import { isMuted, play } from "@/lib/sfx";
import type { TimelineEvent } from "@/lib/types";

type Stage = "disclaimer" | "cert" | "play";

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  const { complete } = useGame();
  const [stage, setStage] = useState<Stage>("disclaimer");
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [showCaption, setShowCaption] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const done = i >= events.length;
  const ev = events[i];

  const go = (d: number) => {
    const n = Math.min(Math.max(i + d, 0), events.length);
    if (n === i) return;
    play("whoosh");
    setDir(d);
    setI(n);
  };

  useEffect(() => {
    if (stage === "cert") {
      play("boot");
      const t = setTimeout(() => setStage("play"), 7000);
      return () => clearTimeout(t);
    }
  }, [stage]);

  useEffect(() => {
    setShowCaption(false);
    const t = setTimeout(() => setShowCaption(true), 900);
    audio.current?.pause();
    if (stage === "play" && ev?.sound && !isMuted()) {
      audio.current = new Audio(ev.sound);
      audio.current.play().catch(() => {});
    }
    return () => clearTimeout(t);
  }, [i, stage, ev]);

  useEffect(() => {
    if (done && stage === "play") complete("timeline");
  }, [done, stage, complete]);

  useEffect(() => {
    if (stage !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!events.length) return <p className="card p-6 text-muted">No events yet. Add some in the admin panel.</p>;

  if (stage === "disclaimer") {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-xl text-center">
        <div className="card p-8">
          <p className="font-mono text-2xl font-bold tracking-[0.3em] text-gold">DISCLAIMER</p>
          <p className="mt-6 text-lg">
            All events depicted in this presentation are based on highly scientific observations of 23 software engineers during technical training.
          </p>
          <p className="mt-4 text-lg text-muted">Any resemblance to actual incidents is absolutely intentional.</p>
          <button className="btn btn-primary mt-8" onClick={() => setStage("cert")} autoFocus>I understand · Continue</button>
        </div>
      </motion.section>
    );
  }

  if (stage === "cert") {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[60dvh] flex-col items-center justify-center text-center" aria-live="polite">
        <Certificate />
        <p className="mt-5 text-sm text-muted">3 months. 23 engineers. Several incidents.</p>
        <button className="btn mt-4" onClick={() => setStage("play")}>Roll the film ▶</button>
      </motion.section>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      {/* Desktop: vertical timeline rail */}
      <nav aria-label="Timeline" className="hidden md:block">
        <ol className="relative border-l border-line pl-5">
          {events.map((e, k) => (
            <li key={e.id} className="relative pb-5">
              <span className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border ${k < i ? "border-mint bg-mint" : k === i ? "border-mint bg-ink ring-4 ring-mint/20" : "border-line bg-ink"}`} />
              <button
                disabled={k > i}
                onClick={() => { setDir(k > i ? 1 : -1); setI(k); }}
                className={`text-left text-sm ${k === i ? "text-text" : "text-muted"} disabled:opacity-40`}
              >
                <span className="label block">Event {String(k + 1).padStart(2, "0")}</span>
                {k <= i ? e.title : "???"}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section aria-live="polite">
        <AnimatePresence mode="wait" custom={dir}>
          {!done ? (
            <motion.article
              key={ev.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: dir * -60 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => { if (info.offset.x < -70) go(1); else if (info.offset.x > 70) go(-1); }}
              className="card overflow-hidden"
            >
              <div className="border-b border-line p-5">
                <p className="label">Event {String(i + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}{ev.phase && ` · ${ev.phase}`}</p>
                <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{ev.title}</h2>
                {ev.context && <p className="mt-2 text-muted">{ev.context}</p>}
              </div>
              <div className="flex min-h-64 items-center justify-center bg-black/40 p-4">
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: "spring" }} className="w-full">
                  <Media url={ev.media.url} query={ev.media.query} source={ev.media.source} alt={ev.caption} className="mx-auto max-h-[46dvh] w-full" />
                </motion.div>
              </div>
              <div className="min-h-20 p-5">
                <AnimatePresence>
                  {showCaption && ev.caption && (
                    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-lg font-semibold">
                      “{ev.caption}”
                    </motion.p>
                  )}
                </AnimatePresence>
                {showCaption && ev.media.source && ev.media.url && (
                  <p className="mt-2 text-center text-xs text-muted">
                    <a href={ev.media.source} target="_blank" rel="noreferrer" className="underline">source</a>
                  </p>
                )}
              </div>
            </motion.article>
          ) : (
            <motion.div key="end" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 text-center">
              <p className="label !text-gold">Level complete</p>
              <h2 className="mt-2 text-3xl font-bold">END OF TIMELINE</h2>
              <p className="mt-2 text-muted">No memes were harmed. Several egos were.</p>
              <Link href="/hub" className="btn btn-primary mt-6">Back to hub</Link>
            </motion.div>
          )}
        </AnimatePresence>

        {!done && (
          <div className="mt-5 flex items-center justify-between">
            <button className="btn" onClick={() => go(-1)} disabled={i === 0}>← Prev</button>
            <span className="hidden font-mono text-xs text-muted sm:inline">← → keys or swipe</span>
            <button className="btn btn-primary" onClick={() => go(1)}>{i === events.length - 1 ? "Finish" : "Next event"} →</button>
          </div>
        )}
      </section>
    </div>
  );
}
