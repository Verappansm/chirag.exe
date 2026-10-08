// Server-side validation + sanitising of everything the admin sends.
// Output is a clean object in the exact JSON shape; throws ValidationError otherwise.
import type { ContentKind, ContentMap, OptionId } from "@/lib/types";

export class ValidationError extends Error {}

const strip = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F<>]/g, "");
function str(v: unknown, max: number, label: string, required = false): string {
  const s = typeof v === "string" ? strip(v).trim() : "";
  if (required && !s) throw new ValidationError(`${label} is required`);
  if (s.length > max) throw new ValidationError(`${label} is too long (max ${max})`);
  return s;
}
function url(v: unknown, label: string): string {
  const s = str(v, 1000, label);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {}
  throw new ValidationError(`${label} must be an http(s) URL or a /path`);
}
function arr(v: unknown, max: number, label: string): unknown[] {
  if (!Array.isArray(v)) throw new ValidationError(`${label} must be a list`);
  if (v.length > max) throw new ValidationError(`Too many ${label}`);
  return v;
}
function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function id(v: unknown, fallback: string): string {
  const s = typeof v === "string" ? v.replace(/[^a-z0-9-]/gi, "").slice(0, 40) : "";
  return s || fallback;
}
const IDS: OptionId[] = ["a", "b", "c", "d"];

function trainees(body: unknown): ContentMap["trainees"] {
  const items = arr(obj(body).questions, 100, "questions");
  return {
    questions: items.map((raw, i) => {
      const q = obj(raw);
      const n = `Question ${i + 1}`;
      const opts = arr(q.options, 4, "options");
      if (opts.length !== 4) throw new ValidationError(`${n}: needs 4 options`);
      const options = opts.map((o, j) => ({
        id: IDS[j],
        label: str(obj(o).label, 80, `${n} option ${IDS[j].toUpperCase()}`, true),
      }));
      const correct = IDS.includes(q.correctOption as OptionId) ? (q.correctOption as OptionId) : null;
      if (!correct) throw new ValidationError(`${n}: pick the correct option`);
      const clues = arr(q.clues, 6, "clues")
        .map((c) => str(c, 300, `${n} clue`))
        .filter(Boolean);
      if (clues.length < 3) throw new ValidationError(`${n}: needs at least 3 clues`);
      const award = obj(q.award);
      return {
        id: id(q.id, `trainee-${String(i + 1).padStart(3, "0")}`),
        enabled: q.enabled !== false,
        title: str(q.title, 120, `${n} title`) || "Who is this trainee?",
        traineeName: options[IDS.indexOf(correct)].label,
        clues,
        options,
        correctOption: correct,
        award: {
          title: str(award.title, 80, `${n} award title`),
          description: str(award.description, 300, `${n} award description`),
        },
        image: url(q.image, `${n} image`),
        explanation: str(q.explanation, 400, `${n} explanation`),
      };
    }),
  };
}

function chiragSays(body: unknown): ContentMap["chirag-says"] {
  const items = arr(obj(body).questions, 100, "questions");
  return {
    questions: items.map((raw, i) => {
      const q = obj(raw);
      const n = `Question ${i + 1}`;
      const opts = arr(q.options, 4, "options");
      if (opts.length !== 4) throw new ValidationError(`${n}: needs 4 options`);
      const co = Number(q.correctOption);
      if (![0, 1, 2, 3].includes(co)) throw new ValidationError(`${n}: pick the correct option`);
      return {
        id: id(q.id, `say-${String(i + 1).padStart(3, "0")}`),
        enabled: q.enabled !== false,
        question: str(q.question, 300, `${n} situation`, true),
        options: opts.map((o, j) => str(o, 200, `${n} option ${IDS[j].toUpperCase()}`, true)),
        correctOption: co,
        successMessage: str(q.successMessage, 300, `${n} success message`),
        award: str(q.award, 80, `${n} award`),
        image: url(q.image, `${n} image`),
      };
    }),
  };
}

function timeline(body: unknown): ContentMap["timeline"] {
  const items = arr(obj(body).events, 100, "events");
  return {
    events: items.map((raw, i) => {
      const e = obj(raw);
      const m = obj(e.media);
      const n = `Event ${i + 1}`;
      return {
        id: id(e.id, `event-${String(i + 1).padStart(3, "0")}`),
        enabled: e.enabled !== false,
        phase: str(e.phase, 60, `${n} phase`),
        title: str(e.title, 80, `${n} title`, true),
        context: str(e.context, 500, `${n} context`),
        caption: str(e.caption, 300, `${n} caption`),
        media: {
          url: url(m.url, `${n} meme URL`),
          source: url(m.source, `${n} source URL`),
          query: str(m.query, 150, `${n} search query`),
        },
        sound: url(e.sound, `${n} sound URL`),
      };
    }),
  };
}

function thankYou(body: unknown): ContentMap["thank-you"] {
  const b = obj(body);
  const msgs = arr(b.messages, 100, "messages");
  return {
    lines: arr(b.lines ?? [], 20, "lines").map((l) => str(l, 200, "Line")).filter(Boolean),
    messages: msgs.map((raw, i) => {
      const m = obj(raw);
      const n = `Message ${i + 1}`;
      return {
        id: id(m.id, `msg-${String(i + 1).padStart(3, "0")}`),
        enabled: m.enabled !== false,
        name: str(m.name, 60, `${n} name`, true),
        message: str(m.message, 1000, `${n} message`),
        mediaUrl: url(m.mediaUrl, `${n} photo/video`),
      };
    }),
  };
}

export function sanitize<K extends ContentKind>(kind: K, body: unknown): ContentMap[K] {
  const map = { trainees, "chirag-says": chiragSays, timeline, "thank-you": thankYou };
  return map[kind](body) as ContentMap[K];
}

export const LIST_KEY = {
  trainees: "questions",
  "chirag-says": "questions",
  timeline: "events",
  "thank-you": "messages",
} as const;

/** Validate a single item by running it through the same list validator. */
export function sanitizeItem<K extends ContentKind>(kind: K, item: unknown): { id: string; enabled: boolean } {
  const wrapped = { [LIST_KEY[kind]]: [item] };
  const clean = sanitize(kind, wrapped) as unknown as Record<string, { id: string; enabled: boolean }[]>;
  return clean[LIST_KEY[kind]][0];
}

export function sanitizeLines(lines: unknown): string[] {
  return arr(lines, 20, "lines").map((l) => str(l, 200, "Line")).filter(Boolean);
}
