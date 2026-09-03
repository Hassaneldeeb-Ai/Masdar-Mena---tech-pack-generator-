import { NextRequest, NextResponse } from "next/server";
import { addRevision, bumpVersion, getProject, saveTechPack, saveUniversal } from "@/lib/db";

export const runtime = "nodejs";

const APPROVAL_ORDER = [
  "AI_DRAFT",
  "IN_REVIEW",
  "TECHNICAL_REVIEW",
  "SAMPLE_APPROVAL",
  "PRODUCTION_APPROVAL",
  "APPROVED",
] as const;

const STAGE_BY_APPROVAL: Record<string, string> = {
  IN_REVIEW: "DEVELOPMENT",
  TECHNICAL_REVIEW: "SAMPLE",
  SAMPLE_APPROVAL: "SAMPLE",
  PRODUCTION_APPROVAL: "PRE_PRODUCTION",
  APPROVED: "APPROVED",
};

/** Advance (or request-change) the approval workflow status. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.tech_pack || !project.universal) {
    return NextResponse.json({ error: "Specification not ready" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "advance" && action !== "request_change") {
    return NextResponse.json({ error: "action must be 'advance' or 'request_change'" }, { status: 400 });
  }
  const note = typeof body?.note === "string" ? body.note.slice(0, 500) : undefined;

  const current = project.universal.readiness?.approval_status ?? "AI_DRAFT";
  const advanced = action === "advance" ? ADVANCE_AFTER(current) : "AI_DRAFT";
  if (action === "advance" && advanced === null) {
    return NextResponse.json({ error: "Specification is already approved" }, { status: 400 });
  }
  const next = advanced as NonNullable<typeof advanced>;

  const spec = structuredClone(project.universal);
  if (!spec.readiness) return NextResponse.json({ error: "Readiness not computed" }, { status: 400 });
  spec.readiness.approval_status = next;
  if (STAGE_BY_APPROVAL[next]) spec.readiness.stage = STAGE_BY_APPROVAL[next] as never;
  saveUniversal(id, spec);

  const nextPack = structuredClone(project.tech_pack);
  nextPack.version = bumpVersion(nextPack.version);
  nextPack.review_status = next === "APPROVED" ? "APPROVED" : "REVIEW_REQUIRED";
  nextPack.generated_at = new Date().toISOString();
  saveTechPack(id, nextPack, project.qa_report);

  addRevision(
    id,
    "readiness.approval_status",
    current,
    next,
    note ?? (action === "advance" ? "Approval status advanced by reviewer." : "Change requested."),
    nextPack.version
  );

  return NextResponse.json({ project: getProject(id) });
}

function ADVANCE_AFTER(current: string): (typeof APPROVAL_ORDER)[number] | null {
  const i = APPROVAL_ORDER.indexOf(current as (typeof APPROVAL_ORDER)[number]);
  if (i < 0) return APPROVAL_ORDER[1];
  return i + 1 >= APPROVAL_ORDER.length ? null : APPROVAL_ORDER[i + 1];
}
