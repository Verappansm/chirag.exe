// Data repository: JSON seed (/data) -> persistent storage override.
// All admin writes go through mutateContent(), which re-reads the latest data, applies ONE small
// change, and writes with compare-and-set (retrying on conflict). Concurrent admins therefore merge.
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

async function read<K extends ContentKind>(kind: K): Promise<{ rev: number; data: ContentMap[K] }> {
  const env = await getStorage().get(key(kind));
  return env ? { rev: env.rev, data: env.data as ContentMap[K] } : { rev: 0, data: getSeed(kind) };
}

export async function getContent<K extends ContentKind>(kind: K): Promise<ContentMap[K]> {
  try {
    return (await read(kind)).data;
  } catch (e) {
    console.error("storage read failed, using seed", e);
    return getSeed(kind);
  }
}

/** Apply `change` to the latest data, atomically. Throws if it can't win after several retries. */
export async function mutateContent<K extends ContentKind>(
  kind: K,
  change: (current: ContentMap[K]) => ContentMap[K],
): Promise<ContentMap[K]> {
  const storage = getStorage();
  for (let attempt = 0; attempt < 10; attempt++) {
    const { rev, data } = await read(kind);
    const next = change(structuredClone(data));
    if (await storage.cas(key(kind), rev, { rev: rev + 1, data: next })) return next;
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 60)); // brief jitter, then retry
  }
  throw new Error("Too many simultaneous edits, please try again");
}

export async function resetContent(kind: ContentKind) {
  await getStorage().del(key(kind));
}

/** Public games only see enabled items. */
export function onlyEnabled<T extends { enabled: boolean }>(items: T[]): T[] {
  return items.filter((i) => i.enabled);
}
