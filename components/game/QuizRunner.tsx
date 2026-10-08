"use client";
// Generic quiz flow: progress -> question -> next -> level complete. Used by both quiz games.
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "@/components/animations/Confetti";
import { LevelId, useGame } from "./GameProvider";

export interface QuestionProps<T> {
  q: T;
  preview: boolean;
  isLast: boolean;
  onNext: () => void;
}

export default function QuizRunner<T extends { id: string }>({
  levelId, label, items, preview = false, Question, emptyText,
}: {
  levelId: LevelId; label: string; items: T[]; preview?: boolean;
  Question: React.ComponentType<QuestionProps<T>>; emptyText: string;
}) {
  const { complete } = useGame();
  const [i, setI] = useState(0);
  const finished = i >= items.length;

  if (!items.length) return <p className="card p-6 text-muted">{emptyText}</p>;

  if (finished) {
    return (
      <div className="card relative overflow-hidden p-8 text-center">
        <Confetti count={60} />
        <p className="label !text-gold">Level complete</p>
        <h2 className="mt-2 text-3xl font-bold">{label} — CLEARED</h2>
        <p className="mt-2 text-muted">{items.length} / {items.length} done. Absolute legend.</p>
        {!preview && (
          <Link href="/hub" onClick={() => complete(levelId)} className="btn btn-primary mt-6">Back to hub</Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between font-mono text-xs tracking-widest text-muted">
        <span>QUESTION {i + 1} / {items.length}</span>
        <span>{preview ? "PREVIEW" : "+XP ON CORRECT"}</span>
      </div>
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-panel2" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={i}>
        <div className="h-full bg-mint transition-all duration-500" style={{ width: `${(i / items.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={items[i].id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          <Question q={items[i]} preview={preview} isLast={i === items.length - 1} onNext={() => {
            if (preview && i === items.length - 1) return;
            setI(i + 1);
          }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
