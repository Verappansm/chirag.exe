"use client";
import ListEditor, { EditorConfig, Field, Text } from "./ListEditor";
import TraineeGame from "@/components/game/TraineeGame";
import SayGame from "@/components/game/SayGame";
import Media from "@/components/ui/Media";
import type {
  OptionId, SayData, SayQuestion, ThankYouData, ThankYouMessage, TimelineData, TimelineEvent, TraineeQuestion, TraineesData,
} from "@/lib/types";

const L = ["A", "B", "C", "D"];
const IDS: OptionId[] = ["a", "b", "c", "d"];

/* ---------------- Who is this trainee ---------------- */
const traineeConfig: EditorConfig<TraineesData, TraineeQuestion> = {
  kind: "trainees",
  listKey: "questions",
  noun: "Question",
  blank: (n) => ({
    id: `trainee-${n}`, enabled: true, title: "Who is this trainee?", traineeName: "",
    clues: ["", "", ""],
    options: IDS.map((id) => ({ id, label: "" })),
    correctOption: "a", award: { title: "", description: "" }, image: "", explanation: "",
  }),
  summary: (q) => q.options.find((o) => o.id === q.correctOption)?.label || q.clues[0] || "",
  Form: ({ item: q, onChange }) => (
    <>
      <Text label="Question title" value={q.title} onChange={(title) => onChange({ title })} />
      <div>
        <p className="label mb-2">Clues (3 required, 4th optional — the game reveals them one by one)</p>
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <input key={i} className="input" aria-label={`Clue ${i + 1}`} placeholder={`Clue ${i + 1}${i === 3 ? " (optional)" : ""}`}
              value={q.clues[i] ?? ""} onChange={(e) => { const c = [...q.clues]; while (c.length < 4) c.push(""); c[i] = e.target.value; onChange({ clues: c }); }} />
          ))}
        </div>
      </div>
      <div>
        <p className="label mb-2">Options — select the correct one</p>
        <div className="space-y-2">
          {q.options.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              <input type="radio" name={`c-${q.id}`} checked={q.correctOption === o.id} onChange={() => onChange({ correctOption: o.id })} aria-label={`Option ${L[i]} is correct`} />
              <span className="w-5 font-mono text-mint">{L[i]}</span>
              <input className="input" aria-label={`Option ${L[i]}`} value={o.label}
                onChange={(e) => onChange({ options: q.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Text label="Award title" value={q.award.title} placeholder="THE SILENT ASSASSIN" onChange={(title) => onChange({ award: { ...q.award, title } })} />
        <Text label="Award description" value={q.award.description} onChange={(description) => onChange({ award: { ...q.award, description } })} />
      </div>
      <Text label="Trainee image URL (optional)" value={q.image} hint="https://… or /images/name.jpg (put files in public/images)" onChange={(image) => onChange({ image })} />
      <Text label="Explanation after answering (optional)" value={q.explanation} area onChange={(explanation) => onChange({ explanation })} />
    </>
  ),
  Preview: ({ item }) => <TraineeGame questions={[item]} preview />,
};
export const TraineesEditor = ({ initial }: { initial: TraineesData }) => <ListEditor config={traineeConfig} initial={initial} />;

/* ---------------- What would Chirag say ---------------- */
const sayConfig: EditorConfig<SayData, SayQuestion> = {
  kind: "chirag-says",
  listKey: "questions",
  noun: "Question",
  blank: (n) => ({ id: `say-${n}`, enabled: true, question: "", options: ["", "", "", ""], correctOption: 0, successMessage: "Exactly.", award: "", image: "" }),
  summary: (q) => q.question,
  Form: ({ item: q, onChange }) => (
    <>
      <Text label="Question / situation" value={q.question} area onChange={(question) => onChange({ question })} />
      <div>
        <p className="label mb-2">Options — select the one Chirag would actually say</p>
        <div className="space-y-2">
          {q.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name={`c-${q.id}`} checked={q.correctOption === i} onChange={() => onChange({ correctOption: i })} aria-label={`Option ${L[i]} is correct`} />
              <span className="w-5 font-mono text-mint">{L[i]}</span>
              <input className="input" aria-label={`Option ${L[i]}`} value={o} onChange={(e) => onChange({ options: q.options.map((x, k) => (k === i ? e.target.value : x)) })} />
            </div>
          ))}
        </div>
      </div>
      <Text label="Correct-answer reaction" value={q.successMessage} hint="Shown under “CHIRAG APPROVED”. Default: Exactly." onChange={(successMessage) => onChange({ successMessage })} />
      <Text label="Award (optional)" value={q.award} onChange={(award) => onChange({ award })} />
      <Text label="Image / GIF URL (optional)" value={q.image} onChange={(image) => onChange({ image })} />
    </>
  ),
  Preview: ({ item }) => <SayGame questions={[item]} preview />,
};
export const SayEditor = ({ initial }: { initial: SayData }) => <ListEditor config={sayConfig} initial={initial} />;

/* ---------------- Meme timeline ---------------- */
const timelineConfig: EditorConfig<TimelineData, TimelineEvent> = {
  kind: "timeline",
  listKey: "events",
  noun: "Event",
  blank: (n) => ({ id: `event-${n}`, enabled: true, phase: "", title: "", context: "", caption: "", media: { url: "", source: "", query: "" }, sound: "" }),
  summary: (e) => e.title,
  Form: ({ item: e, onChange }) => (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Text label="Event title" value={e.title} onChange={(title) => onChange({ title })} />
        <Text label="Date / phase" value={e.phase} placeholder="Day 1" onChange={(phase) => onChange({ phase })} />
      </div>
      <Text label="Context" value={e.context} area onChange={(context) => onChange({ context })} />
      <Text label="Caption" value={e.caption} onChange={(caption) => onChange({ caption })} />
      <Text label="Meme / GIF URL" value={e.media.url} hint="Direct link to an image, GIF or .mp4 (e.g. https://media.giphy.com/media/<id>/giphy.gif). Leave empty to show a search card." onChange={(url) => onChange({ media: { ...e.media, url } })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Text label="Source page URL" value={e.media.source} onChange={(source) => onChange({ media: { ...e.media, source } })} />
        <Text label="Search query" value={e.media.query} onChange={(query) => onChange({ media: { ...e.media, query } })} />
      </div>
      <Text label="Sound effect URL (optional)" value={e.sound} onChange={(sound) => onChange({ sound })} />
      {e.media.query && (
        <a className="text-sm text-mint underline" target="_blank" rel="noreferrer" href={`https://giphy.com/search/${encodeURIComponent(e.media.query)}`}>
          Search GIPHY for “{e.media.query}” ↗
        </a>
      )}
    </>
  ),
  Preview: ({ item }) => (
    <div className="text-center">
      <h3 className="text-2xl font-bold">{item.title}</h3>
      <p className="text-muted">{item.context}</p>
      <Media url={item.media.url} query={item.media.query} source={item.media.source} className="mx-auto my-4 max-h-80 w-full" />
      <p className="text-lg font-semibold">“{item.caption}”</p>
    </div>
  ),
};
export const TimelineEditor = ({ initial }: { initial: TimelineData }) => <ListEditor config={timelineConfig} initial={initial} />;

/* ---------------- Final thank-you ---------------- */
const thankConfig: EditorConfig<ThankYouData, ThankYouMessage> = {
  kind: "thank-you",
  listKey: "messages",
  noun: "Message",
  blank: (n) => ({ id: `msg-${n}`, enabled: true, name: "", message: "", mediaUrl: "" }),
  summary: (m) => `${m.name}${m.message ? " — " + m.message : ""}`,
  Header: ({ data, setData }) => (
    <div className="card mb-5 p-4">
      <Field label="Thank-you lines (one per line; the first is the big heading)">
        <textarea className="input" rows={8} value={data.lines.join("\n")}
          onChange={(e) => setData({ ...data, lines: e.target.value.split("\n") })} />
      </Field>
      <p className="mt-1 text-xs text-muted">Saved together with the messages below.</p>
    </div>
  ),
  Form: ({ item: m, onChange }) => (
    <>
      <Text label="Person name" value={m.name} onChange={(name) => onChange({ name })} />
      <Text label="Message" value={m.message} area onChange={(message) => onChange({ message })} />
      <Text label="Photo / video URL (optional)" value={m.mediaUrl} hint="Image, GIF or .mp4/.webm — https://… or /images/name.jpg" onChange={(mediaUrl) => onChange({ mediaUrl })} />
    </>
  ),
};
export const ThankYouEditor = ({ initial }: { initial: ThankYouData }) => <ListEditor config={thankConfig} initial={initial} />;
