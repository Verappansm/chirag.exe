// Data repository: JSON seed (/data) -> persistent storage override.
import trainees from "@/data/trainees.json";
import chiragSays from "@/data/chirag-says.json";
import timeline from "@/data/timeline.json";
import thankYou from "@/data/thank-you.json";
import { getStorage } from "@/lib/storage";
import type { ContentKind, ContentMap } from "@/lib/types";

const seeds = {
  trainees,
  "chirag-says": chiragSays,
  timeline,
  "thank-you": thankYou,
} as unknown as ContentMap;

const key = (k: ContentKind) => `chirag-game:${k}`;

export function getSeed<K extends ContentKind>(kind: K): ContentMap[K] {
  return structuredClone(seeds[kind]);
}

export async function getContent<K extends ContentKind>(kind: K): Promise<ContentMap[K]> {
  try {
    const stored = await getStorage().get(key(kind));
    if (stored) return stored as ContentMap[K];
  } catch (e) {
    console.error("storage read failed, using seed", e);
  }
  return getSeed(kind);
}

export async function saveContent<K extends ContentKind>(kind: K, data: ContentMap[K]) {
  await getStorage().set(key(kind), data);
}

export async function resetContent(kind: ContentKind) {
  await getStorage().del(key(kind));
}

/** Public games only see enabled items. */
export function onlyEnabled<T extends { enabled: boolean }>(items: T[]): T[] {
  return items.filter((i) => i.enabled);
}
