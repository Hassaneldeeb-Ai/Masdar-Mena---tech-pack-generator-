import { NextResponse } from "next/server";
import { getProject } from "@/lib/db";

export const runtime = "nodejs";

/** Export the tech pack as a downloadable JSON file. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(id);
  if (!project?.tech_pack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const payload = {
    meta: {
      exported_at: new Date().toISOString(),
      project_id: project.id,
      status: "AI_GENERATED_REVIEW_REQUIRED",
    },
    product: project.tech_pack.product,
    materials: project.tech_pack.materials,
    bom: project.tech_pack.bom,
    measurements: project.tech_pack.measurements,
    construction: project.tech_pack.construction,
    stitching: project.tech_pack.stitching,
    colorways: project.tech_pack.colorways,
    labels: project.tech_pack.labels,
    quality_control: project.tech_pack.quality_control,
    packaging: project.tech_pack.packaging,
    assumptions: project.tech_pack.assumptions,
    warnings: project.tech_pack.warnings,
    qa_report: project.qa_report,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tech-pack-${id.slice(0, 8)}.json"`,
    },
  });
}
