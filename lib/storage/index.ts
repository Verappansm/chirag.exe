// Storage abstraction: a tiny key/value interface with swappable providers.
//   1. Upstash Redis / Vercel KV (REST)  -> production, persistent
//   2. Local file in ./.data             -> local dev
//   3. In-memory                         -> Vercel without a DB (NOT persistent; admin warns)
// To use another provider, implement `Storage` and return it from getStorage().
import { promises as fs } from "fs";
import path from "path";

export interface Storage {
  name: string;
  persistent: boolean;
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

function upstash(url: string, token: string): Storage {
  const call = async (cmd: unknown[]) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Storage error ${res.status}`);
    return (await res.json()).result;
  };
  return {
    name: "Upstash Redis / Vercel KV",
    persistent: true,
    async get(key) {
      const raw = await call(["GET", key]);
      return raw ? JSON.parse(raw) : null;
    },
    async set(key, value) {
      await call(["SET", key, JSON.stringify(value)]);
    },
    async del(key) {
      await call(["DEL", key]);
    },
  };
}

function localFile(): Storage {
  const dir = path.join(process.cwd(), ".data");
  const file = (k: string) => path.join(dir, `${k.replace(/[^a-z0-9-]/gi, "_")}.json`);
  return {
    name: "Local file (.data/)",
    persistent: true,
    async get(key) {
      try {
        return JSON.parse(await fs.readFile(file(key), "utf8"));
      } catch {
        return null;
      }
    },
    async set(key, value) {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file(key), JSON.stringify(value, null, 2));
    },
    async del(key) {
      await fs.rm(file(key), { force: true });
    },
  };
}

const mem = new Map<string, unknown>();
const memory: Storage = {
  name: "In-memory (NOT persistent)",
  persistent: false,
  async get(k) {
    return mem.has(k) ? mem.get(k)! : null;
  },
  async set(k, v) {
    mem.set(k, v);
  },
  async del(k) {
    mem.delete(k);
  },
};

let cached: Storage | null = null;
export function getStorage(): Storage {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) cached = upstash(url, token);
  else if (process.env.VERCEL) cached = memory;
  else cached = localFile();
  return cached;
}
