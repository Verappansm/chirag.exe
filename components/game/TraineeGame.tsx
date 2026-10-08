"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Media from "@/components/ui/Media";
import QuizRunner, { QuestionProps } from "./QuizRunner";
import { OptionButton, RightPanel, WRONG_LINES, WrongPanel } from "./quiz-ui";
import { useGame } from "./GameProvider";
import { play } from "@/lib/sfx";
import type { TraineeQuestion } from "@/lib/types";

function Question({ q, preview, isLast, onNext }: QuestionProps<TraineeQuestion>) {
  const { addXp, unlock } = useGame();
  const [clues, setClues] = useState(1);
  const [wrong, setWrong] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const xp = Math.max(40, 100 - wrong.length * 20);

  const pick = (id: string) => {
    if (id === q.correctOption) {
      play("correct");
      setSolved(true);
      if (!preview) { addXp(xp); unlock(q.award.title, q.award.description); }
    } else {
      play("wrong");
      setWrong((w) => [...w, id]);
      setMsg(WRONG_LINES[(wrong.length + q.id.length) % WRONG_LINES.length]);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (solved || msg || e.metaKey || e.ctrlKey || (e.target as HTMLElement)?.closest("input,textarea")) return;
      const idx = "abcd".indexOf(e.key.toLowerCase());
      const n = Number(e.key) - 1;
      const opt = q.options[idx >= 0 ? idx : n];
      if (opt && !wrong.includes(opt.id)) pick(opt.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section aria-labelledby="q-title">
      <p className="label">{q.title}</p>
      <h2 id="q-title" className="sr-only">{q.title}</h2>
      <div className="mt-3 space-y-3">
        {q.clues.slice(0, clues).map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
            <p className="label !text-mint">Clue #{i + 1}</p>
            <p className="mt-1 text-lg">{c}</p>
          </motion.div>
        ))}
      </div>
      {clues < q.clues.length && !solved && (
        <button className="btn mt-3" onClick={() => { play("click"); setClues(clues + 1); }}>
          Reveal next clue ({clues}/{q.clues.length})
        </button>
      )}
      <p className="label mt-6 mb-3">Who is it?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((o, i) => (
          <OptionButton
            key={o.id}
            letter={"ABCD"[i]}
            text={o.label}
            state={solved && o.id === q.correctOption ? "right" : wrong.includes(o.id) ? "wrong" : "idle"}
            disabled={solved || !!msg || wrong.includes(o.id)}
            onClick={() => pick(o.id)}
          />
        ))}
      </div>
      {msg && !solved && <WrongPanel message={msg} onRetry={() => setMsg(null)} />}
      {solved && (
        <RightPanel
          heading="🎉 CORRECT!"
          sub={`You found them: ${q.traineeName}`}
          image={q.image ? <Media url={q.image} alt={q.traineeName} className="h-28 w-28 !rounded-full object-cover" /> : null}
          award={q.award.title}
          awardDesc={q.award.description}
          note={q.explanation}
          xp={xp}
          isLast={isLast}
          onNext={onNext}
        />
      )}
    </section>
  );
}

export default function TraineeGame({ questions, preview = false }: { questions: TraineeQuestion[]; preview?: boolean }) {
  return (
    <QuizRunner levelId="trainee" label="WHO IS THIS TRAINEE?" items={questions} preview={preview}
      Question={Question} emptyText="No questions yet. Add some in the admin panel." />
  );
}
