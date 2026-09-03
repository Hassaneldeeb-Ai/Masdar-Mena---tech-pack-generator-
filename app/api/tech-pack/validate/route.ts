import { NextResponse, NextRequest } from "next/server";
import { getProject } from "@/lib/db";
import { requalifyTechPack } from "@/lib/ai/pipeline";

export const runtime = "nodejs";

/** Re-run the validation/QA engine against the current tech pack data. */
export async function POST(req: NextRequest) {
  const { projectId } = await req.json().catch(() => ({}));
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  const project = getProject(projectId);
  if (!project?.tech_pack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const qaReport = requalifyTechPack(projectId, project.tech_pack, project.sizes, project.quantity);
  return NextResponse.json({ qaReport });
}
