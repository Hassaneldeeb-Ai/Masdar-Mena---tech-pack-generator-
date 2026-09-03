import { NextResponse, NextRequest } from "next/server";
import { addRevision, bumpVersion, getProject, getRevisions } from "@/lib/db";
import { getPath, isValidPath, setPath } from "@/lib/edits";
import { requalifyTechPack } from "@/lib/ai/pipeline";
import { TechPackSchema } from "@/lib/schemas/tech-pack";

export const runtime = "nodejs";

/** Top-level tech-pack sections a reviewer may edit. */
const ALLOWED_ROOTS = new Set([
  "product",
  "materials",
  "bom",
  "measurements",
  "construction",
  "stitching",
  "colorways",
  "labels",
  "quality_control",
  "packaging",
  "assumptions",
]);

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project, revisions: getRevisions(id) });
}

/** Apply human edits to the tech pack. Bumps version, logs revisions, re-qualifies. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(id);
  if (!project?.tech_pack) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const patches = body?.patches;
  if (!Array.isArray(patches) || patches.length === 0) {
    return NextResponse.json({ error: "patches[] required" }, { status: 400 });
  }

  const targetVersion = bumpVersion(project.tech_pack.version);
  let next = project.tech_pack;
  for (const p of patches) {
    const root = typeof p?.field === "string" ? p.field.split(".")[0] : "";
    if (!p?.field || !isValidPath(p.field) || !ALLOWED_ROOTS.has(root)) {
      return NextResponse.json({ error: `Invalid field path: ${p?.field}` }, { status: 400 });
    }
    const oldValue = getPath(next, p.field);
    next = setPath(next, p.field, p.value) as typeof next;
    addRevision(id, p.field, oldValue, p.value, p.reason, targetVersion);
  }

  const parsed = TechPackSchema.safeParse(next);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Edit would produce an invalid tech pack.", issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) },
      { status: 422 }
    );
  }
  next.version = targetVersion;
  next.review_status = "REVIEW_REQUIRED";
  next.generated_at = new Date().toISOString();
  const qaReport = requalifyTechPack(id, next, project.sizes, project.quantity);

  const updated = getProject(id);
  return NextResponse.json({ project: updated, qaReport, revisions: getRevisions(id) });
}
