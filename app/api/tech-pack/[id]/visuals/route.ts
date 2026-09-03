import { NextRequest, NextResponse } from "next/server";
import { addRevision, getProject, saveUniversal } from "@/lib/db";
import { generateProductVisual } from "@/lib/ai/image";

export const runtime = "nodejs";
export const maxDuration = 180;

/** Generate one generative visual-asset (hero render) from the reference image. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(id);
  if (!project?.universal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const assetId = typeof body?.assetId === "string" ? body.assetId : "";
  if (!assetId) return NextResponse.json({ error: "assetId required" }, { status: 400 });

  const spec = project.universal;
  const asset = spec.visuals_plan?.find((v) => v.id === assetId);
  if (!asset) return NextResponse.json({ error: `Unknown visual asset: ${assetId}` }, { status: 400 });
  if (asset.generation !== "GENERATIVE") {
    return NextResponse.json(
      { error: "This asset type is not AI-generatable." },
      { status: 409 }
    );
  }
  if (asset.status === "GENERATED" && asset.asset_path && !body?.force) {
    return NextResponse.json({ error: "Asset already generated — pass { force: true } to regenerate." }, { status: 409 });
  }

  const result = await generateProductVisual(project, assetId).catch(
    (e): { ok: false; message: string } => ({
      ok: false,
      message: e instanceof Error ? e.message : "Generation failed.",
    })
  );
  if (!result.ok || !result.publicUri) return NextResponse.json({ error: result.message ?? "Generation failed." }, { status: 400 });

  const next = structuredClone(spec);
  const target = next.visuals_plan.find((v) => v.id === assetId);
  if (target) {
    target.status = "GENERATED";
    target.asset_path = result.publicUri;
  }
  saveUniversal(id, next);
  addRevision(id, `visuals_plan.${assetId}.status`, "PLANNED", "GENERATED", "AI visual rendered from reference image.");

  return NextResponse.json({ project: getProject(id), asset: result });
}
