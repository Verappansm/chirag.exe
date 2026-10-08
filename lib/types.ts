// Shapes of the JSON content. Seeds live in /data/*.json
export type OptionId = "a" | "b" | "c" | "d";

export interface TraineeQuestion {
  id: string;
  enabled: boolean;
  title: string;
  traineeName: string; // derived from the correct option label on save
  clues: string[];
  options: { id: OptionId; label: string }[];
  correctOption: OptionId;
  award: { title: string; description: string };
  image: string;
  explanation: string;
}
export interface TraineesData {
  questions: TraineeQuestion[];
}

export interface SayQuestion {
  id: string;
  enabled: boolean;
  question: string;
  options: string[]; // 4 items
  correctOption: number; // 0-3
  successMessage: string;
  award: string;
  image: string;
}
export interface SayData {
  questions: SayQuestion[];
}

export interface TimelineEvent {
  id: string;
  enabled: boolean;
  phase: string;
  title: string;
  context: string;
  caption: string;
  media: { url: string; source: string; query: string };
  sound: string;
}
export interface TimelineData {
  events: TimelineEvent[];
}

export interface ThankYouMessage {
  id: string;
  enabled: boolean;
  name: string;
  message: string;
  mediaUrl: string;
}
export interface ThankYouData {
  lines: string[];
  messages: ThankYouMessage[];
}

export interface ContentMap {
  trainees: TraineesData;
  "chirag-says": SayData;
  timeline: TimelineData;
  "thank-you": ThankYouData;
}
export type ContentKind = keyof ContentMap;
export const CONTENT_KINDS: ContentKind[] = ["trainees", "chirag-says", "timeline", "thank-you"];
export const isKind = (k: string): k is ContentKind => (CONTENT_KINDS as string[]).includes(k);
