"use client";
import { motion } from "framer-motion";
import Confetti from "@/components/animations/Confetti";

export const WRONG_LINES = [
  "Nice try, but Chirag would know you better.",
  "Close. Not close enough.",
  "Bold guess. Wrong, but bold.",
  "Chirag is shaking his head somewhere.",
];

export function OptionButton({
  letter, text, state, disabled, onClick,
}: { letter: string; text: string; state: "idle" | "wrong" | "right"; disabled: boolean; onClick: () => void }) {
  const cls =
    state === "right" ? "border-mint bg-mint/10"
    : state === "wrong" ? "border-bad/50 bg-bad/5 opacity-50 line-through"
    : "border-line bg-panel hover:border-mint/70 hover:bg-panel2";
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      animate={state === "wrong" ? { x: [0, -8, 8, -5, 5, 0] } : {}}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${cls}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-ink font-mono text-sm text-mint">{letter}</span>
      <span className="flex-1">{text}</span>
    </motion.button>
  );
}

export function WrongPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div role="alert" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card mt-5 border-bad/50 p-5 text-center">
      <p className="text-xl font-bold text-bad">❌ WRONG</p>
      <p className="mt-1 text-muted">“{message}”</p>
      <button className="btn mt-4" onClick={onRetry} autoFocus>Try again</button>
    </motion.div>
  );
}

export function RightPanel({
  heading, sub, award, awardDesc, note, image, xp, isLast, onNext,
}: {
  heading: string; sub?: string; award?: string; awardDesc?: string; note?: string;
  image?: React.ReactNode; xp?: number; isLast: boolean; onNext: () => void;
}) {
  return (
    <motion.div role="status" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="card relative mt-5 overflow-hidden border-mint/60 p-6 text-center">
      <Confetti />
      <motion.p initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-2xl font-bold text-mint">{heading}</motion.p>
      {sub && <p className="mt-1 text-lg">{sub}</p>}
      {image && <div className="mt-4 flex justify-center">{image}</div>}
      {award && (
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="mx-auto mt-4 max-w-md rounded-xl border border-gold/50 bg-gold/5 p-4">
          <p className="label !text-gold">🏆 Achievement unlocked</p>
          <p className="mt-1 text-lg font-bold">{award}</p>
          {awardDesc && <p className="text-sm text-muted">{awardDesc}</p>}
        </motion.div>
      )}
      {note && <p className="mt-3 text-sm text-muted">{note}</p>}
      {xp ? <p className="mt-3 font-mono text-sm text-gold">XP +{xp}</p> : null}
      <button className="btn btn-primary mt-5" onClick={onNext} autoFocus>{isLast ? "Finish level" : "Next"} →</button>
    </motion.div>
  );
}
