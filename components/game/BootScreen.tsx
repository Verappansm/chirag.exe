"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import { play } from "@/lib/sfx";

const INTRO = ["FIDELITY TRAINING PROGRAM", "23 TRAINEES", "3 MONTHS", "1 INSTRUCTOR"];
const LOADING = [
  "loading patience.dll ............ OK",
  "loading loss_function.py ........ ???",
  "mounting late_comers.db ......... 23 rows",
  "warming up meme engine .......... OK",
  "chirag.exe ...................... READY",
];

export default function BootScreen() {
  const router = useRouter();
  const [shown, setShown] = useState(0);
  const [starting, setStarting] = useState(false);
  const [log, setLog] = useState(0);

  useEffect(() => {
    if (shown >= INTRO.length + 1) return;
    const t = setTimeout(() => setShown((s) => s + 1), 650);
    return () => clearTimeout(t);
  }, [shown]);

  useEffect(() => {
    if (!starting) return;
    if (log >= LOADING.length) {
      const t = setTimeout(() => router.push("/hub"), 450);
      return () => clearTimeout(t);
    }
    play("click");
    const t = setTimeout(() => setLog((l) => l + 1), 340);
    return () => clearTimeout(t);
  }, [starting, log, router]);

  const ready = shown > INTRO.length;

  return (
    <main className="scanlines relative flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-xl text-center">
        <AnimatePresence mode="wait">
          {!starting ? (
            <motion.div key="intro" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }}>
              <div className="mb-8 flex justify-center">
                <Avatar size={92} />
              </div>
              <div className="space-y-1 font-mono text-sm tracking-[0.25em] text-muted sm:text-base" aria-live="polite">
                {INTRO.slice(0, shown).map((l, i) => (
                  <motion.p key={l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={i === 0 ? "text-text" : ""}>
                    {l}
                  </motion.p>
                ))}
              </div>
              <p className="mt-6 h-5 font-mono text-xs tracking-widest text-mint">
                {shown < INTRO.length + 1 ? <span className="cursor">SYSTEM INITIALIZING...</span> : "SYSTEM READY"}
              </p>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: ready ? 1 : 0.0 }}
                className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl"
              >
                CHIRAG TANK<span className="text-mint">.EXE</span>
              </motion.h1>
              <p className="mt-2 text-sm text-muted">The Training Simulator</p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} className="mt-10">
                <button
                  className="btn btn-primary px-8 py-4 text-base"
                  disabled={!ready}
                  onClick={() => { play("boot"); setStarting(true); }}
                  autoFocus
                >
                  ▶ Start experience
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left font-mono text-xs text-mint sm:text-sm">
              {LOADING.slice(0, log).map((l) => (
                <p key={l}>&gt; {l}</p>
              ))}
              <span className="cursor" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
