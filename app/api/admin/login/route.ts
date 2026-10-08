import { NextRequest, NextResponse } from "next/server";
import { clearFails, createSession, recordFail, throttled, verifyPin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (throttled(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  if (!process.env.ADMIN_PIN_HASH) {
    return NextResponse.json({ error: "ADMIN_PIN_HASH is not configured on the server." }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  if (!verifyPin(String(body?.pin ?? ""))) {
    recordFail(ip);
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }
  clearFails(ip);
  await createSession();
  return NextResponse.json({ ok: true });
}
