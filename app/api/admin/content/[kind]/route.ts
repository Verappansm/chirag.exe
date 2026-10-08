import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getContent, resetContent, saveContent } from "@/lib/repo";
import { isKind } from "@/lib/types";
import { sanitize, ValidationError } from "@/lib/validation";

type Ctx = { params: Promise<{ kind: string }> };

async function guard(ctx: Ctx) {
  const { kind } = await ctx.params;
  if (!(await isAdmin())) return { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isKind(kind)) return { res: NextResponse.json({ error: "Unknown section" }, { status: 404 }) };
  return { kind };
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if (!g.kind) return g.res;
  return NextResponse.json(await getContent(g.kind), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if (!g.kind) return g.res;
  try {
    const clean = sanitize(g.kind, await req.json());
    await saveContent(g.kind, clean as never);
    return NextResponse.json(clean);
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}

/** Reset a section back to the JSON seed data. */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if (!g.kind) return g.res;
  await resetContent(g.kind);
  return NextResponse.json({ ok: true });
}
