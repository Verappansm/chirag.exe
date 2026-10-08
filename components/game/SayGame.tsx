"use client";
import { useEffect, useState } from "react";
import Media from "@/components/ui/Media";
import QuizRunner, { QuestionProps } from "./QuizRunner";
import { OptionButton, RightPanel, WrongPanel } from "./quiz-ui";
import { useGame } from "./GameProvider";
import { play } from "@/lib/sfx";
import type { SayQuestion } from "@/lib/types";

const WRONG = ["That doesn't sound like Chirag.", "Chirag would never.", "Wrong tone. Try again.", "Not even close to his vibe."];

function Question({ q, preview, isLast, onNext }: QuestionProps<SayQuestion>) {
  const { addXp, unlock } = useGame();
  const [wrong, setWrong] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const xp = Math.max(40, 100 - wrong.length * 20);

  const pick = (i: number) => {
    if (i === q.correctOption) {
      play("correct");
      setSolved(true);
      if (!preview) { addXp(xp); if (q.award) unlock(q.award); }
    } else {
      play("wrong");
      setWrong((w) => [...w, i]);
      setMsg(WRONG[(wrong.length + q.id.length) % WRONG.length]);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (solved || msg || e.metaKey || e.ctrlKey || (e.target as HTMLElement)?.closest("input,textarea")) return;
      const i = "abcd".indexOf(e.key.toLowerCase());
      const n = Number(e.key) - 1;
      const idx = i >= 0 ? i : n;
      if (idx >= 0 && idx < 4 && !wrong.includes(idx)) pick(idx);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section>
      <p className="label">Situation</p>
      <h2 className="card mt-2 p-5 text-xl font-bold sm:text-2xl">{q.question}</h2>
      {q.image && <Media url={q.image} className="mx-auto mt-4 max-h-60" />}
      <p className="label mt-6 mb-3">What would Chirag say?</p>
      <div className="grid gap-3">
        {q.options.map((o, i) => (
          <OptionButton
            key={i}
            letter={"ABCD"[i]}
            text={o}
            state={solved && i === q.correctOption ? "right" : wrong.includes(i) ? "wrong" : "idle"}
            disabled={solved || !!msg || wrong.includes(i)}
            onClick={() => pick(i)}
          />
        ))}
      </div>
      {msg && !solved && <WrongPanel message={msg} onRetry={() => setMsg(null)} />}
      {solved && (
        <RightPanel heading="🎯 CHIRAG APPROVED" sub={q.successMessage || "Exactly."} award={q.award || undefined} xp={xp} isLast={isLast} onNext={onNext} />
      )}
    </section>
  );
}

export default function SayGame({ questions, preview = false }: { questions: SayQuestion[]; preview?: boolean }) {
  return (
    <QuizRunner levelId="says" label="WHAT WOULD CHIRAG SAY?" items={questions} preview={preview}
      Question={Question} emptyText="No questions yet. Add some in the admin panel." />
  );
}
