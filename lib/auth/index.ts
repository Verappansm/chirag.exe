// Server-side admin auth: scrypt-hashed PIN (env var) + HMAC-signed httpOnly cookie.
import { createHmac, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 12; // 12h

const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PIN_HASH || "";

export function verifyPin(pin: string): boolean {
  const stored = process.env.ADMIN_PIN_HASH;
  if (!stored || !/^\d{6}$/.test(pin)) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = scryptSync(pin, salt, 32);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

export async function createSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!secret()) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = Buffer.from(sign(exp));
  const got = Buffer.from(sig);
  return good.length === got.length && timingSafeEqual(good, got);
}

// Best-effort brute-force throttle (per server instance).
const fails = new Map<string, { n: number; until: number }>();
export function throttled(ip: string) {
  const f = fails.get(ip);
  return !!f && f.n >= 5 && f.until > Date.now();
}
export function recordFail(ip: string) {
  const f = fails.get(ip);
  fails.set(ip, { n: (f?.n ?? 0) + 1, until: Date.now() + 5 * 60 * 1000 });
}
export function clearFails(ip: string) {
  fails.delete(ip);
}
