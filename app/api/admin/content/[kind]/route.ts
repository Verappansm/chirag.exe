import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getContent, mutateContent, resetContent } from "@/lib/repo";
import { ContentKind, isKind } from "@/lib/types";
import { LIST_KEY, sanitizeItem, sanitizeLines, ValidationError } from "@/lib/validation";

type Ctx = { params: Promise<{ kind: string }> };
type Row = { id: string };
const noStore = { "Cache-Control": "no-store" };

async function guard(ctx: Ctx) {
  const { kind } = await ctx.params;
  if (!(await isAdmin())) return { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isKind(kind)) return { res: NextResponse.json({ error: "Unknown section" }, { status: 404 }) };
  return { kind };
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if (!g.kind) return g.res;
  return NextResponse.json(await getContent(g.kind), { headers: noStore });
}

/**
 * Small, merge-friendly edits. Each request changes ONE thing on top of the latest stored data,
 * so two admins editing different items never overwrite each other.
 *   { op: "upsert", item }   add or replace one item (matched by id)
 *   { op: "delete", id }     remove one item
 *   { op: "order",  ids }    reorder (ids not listed keep their place at the end)
 *   { op: "lines",  lines }  thank-you heading lines
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if (!g.kind) return g.res;
  const kind: ContentKind = g.kind;
  const listKey = LIST_KEY[kind];
  try {
    const body = await req.json();
    const data = await mutateContent(kind, (cur) => {
      const draft = cur as unknown as Record<string, unknown>;
      const list = draft[listKey] as Row[];
      switch (body?.op) {
        case "upsert": {
          const item = sanitizeItem(kind, body.item);
          const i = list.findIndex((r) => r.id === item.id);
          if (i >= 0) list[i] = item;
          else list.push(item);
          break;
        }
        case "delete":
          draft[listKey] = list.filter((r) => r.id !== String(body.id));
          break;
        case "order": {
          if (!Array.isArray(body.ids)) throw new ValidationError("ids must be a list");
          const rank = new Map<string, number>((body.ids as unknown[]).map((id, n) => [String(id), n]));
          draft[listKey] = [...list].sort((a, b) => (rank.get(a.id) ?? 1e6) - (rank.get(b.id) ?? 1e6));
          break;
        }
        case "lines":
          if (kind !== "thank-you") throw new ValidationError("Not supported here");
          draft.lines = sanitizeLines(body.lines);
          break;
        default:
          throw new ValidationError("Unknown operation");
      }
      return cur;
    });
    return NextResponse.json(data, { headers: noStore });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save" }, { status: 500 });
  }
}

/** Reset a section back to the JSON seed data. */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const g = await guard(ctx);
  if (!g.kind) return g.res;
  await resetContent(g.kind);
  return NextResponse.json({ ok: true });
}
