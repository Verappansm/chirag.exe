// Storage abstraction: a tiny key/value interface with swappable providers.
//   1. Upstash Redis / Vercel KV (REST)  -> production, persistent
//   2. Local file in ./.data             -> local dev
//   3. In-memory                         -> Vercel without a DB (NOT persistent; admin warns)
// To use another provider, implement `Storage` and return it from getStorage().
//
// Concurrency: values are stored as an envelope { rev, data }. `cas` writes only if the stored
// revision still equals `expectedRev` (atomic), so two admins can never silently overwrite each other.
import { promises as fs } from "fs";
import path from "path";

export interface Envelope {
  rev: number;
  data: unknown;
}

export interface Storage {
  name: string;
  persistent: boolean;
  /** Returns the envelope. Legacy un-enveloped values are returned as rev 0. */
  get(key: string): Promise<Envelope | null>;
  /** Atomic compare-and-set. Returns false if the revision changed in the meantime. */
  cas(key: string, expectedRev: number, next: Envelope): Promise<boolean>;
  del(key: string): Promise<void>;
}

const toEnvelope = (raw: unknown): Envelope | null => {
  if (raw == null) return null;
  const o = raw as { rev?: unknown; data?: unknown };
  if (typeof o.rev === "number" && "data" in o) return { rev: o.rev, data: o.data };
  return { rev: 0, data: raw }; // legacy: value saved before revisions existed
};

// Lua runs atomically inside Redis: compare revision, then write.
const CAS_LUA = `
local cur = redis.call('GET', KEYS[1])
local rev = 0
if cur then
  local ok, obj = pcall(cjson.decode, cur)
  if ok and type(obj) == 'table' and type(obj.rev) == 'number' then rev = obj.rev end
end
if rev == tonumber(ARGV[1]) then
  redis.call('SET', KEYS[1], ARGV[2])
  return 1
end
return 0`;

function upstash(url: string, token: string): Storage {
  const call = async (cmd: unknown[]) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Storage error ${res.status}`);
    const body = await res.json();
    if (body.error) throw new Error(`Storage error: ${body.error}`);
    return body.result;
  };
  return {
    name: "Upstash Redis / Vercel KV",
    persistent: true,
    async get(key) {
      const raw = await call(["GET", key]);
      return raw ? toEnvelope(JSON.parse(raw)) : null;
    },
    async cas(key, expectedRev, next) {
      return (await call(["EVAL", CAS_LUA, "1", key, String(expectedRev), JSON.stringify(next)])) === 1;
    },
    async del(key) {
      await call(["DEL", key]);
    },
  };
}

let lock: Promise<void> = Promise.resolve();
function localFile(): Storage {
  const dir = path.join(process.cwd(), ".data");
  const file = (k: string) => path.join(dir, `${k.replace(/[^a-z0-9-]/gi, "_")}.json`);
  const read = async (key: string) => {
    try {
      return toEnvelope(JSON.parse(await fs.readFile(file(key), "utf8")));
    } catch {
      return null;
    }
  };
  return {
    name: "Local file (.data/)",
    persistent: true,
    get: read,
    // Serialize local writes so read-compare-write is atomic within this process.
    async cas(key, expectedRev, next) {
      const run = async () => {
        if (((await read(key))?.rev ?? 0) !== expectedRev) return false;
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(file(key), JSON.stringify(next, null, 2));
        return true;
      };
      const result = lock.then(run, run);
      lock = result.then(() => undefined, () => undefined);
      return result;
    },
    async del(key) {
      await fs.rm(file(key), { force: true });
    },
  };
}

const mem = new Map<string, Envelope>();
const memory: Storage = {
  name: "In-memory (NOT persistent)",
  persistent: false,
  async get(k) {
    return mem.get(k) ?? null;
  },
  async cas(k, expectedRev, next) {
    if ((mem.get(k)?.rev ?? 0) !== expectedRev) return false;
    mem.set(k, next);
    return true;
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
