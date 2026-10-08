import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SayEditor, ThankYouEditor, TimelineEditor, TraineesEditor } from "@/components/admin/editors";
import { getContent } from "@/lib/repo";
import { isKind } from "@/lib/types";

const TITLES = {
  trainees: "Who is this trainee?",
  "chirag-says": "What would Chirag say?",
  timeline: "Meme timeline",
  "thank-you": "Final thank you",
};

export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isKind(kind)) notFound();
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">{TITLES[kind]}</h1>
      <Suspense>
        {kind === "trainees" && <TraineesEditor initial={await getContent("trainees")} />}
        {kind === "chirag-says" && <SayEditor initial={await getContent("chirag-says")} />}
        {kind === "timeline" && <TimelineEditor initial={await getContent("timeline")} />}
        {kind === "thank-you" && <ThankYouEditor initial={await getContent("thank-you")} />}
      </Suspense>
    </div>
  );
}
