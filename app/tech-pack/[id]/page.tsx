import { notFound } from "next/navigation";
import { getProject, getRevisions } from "@/lib/db";
import { queueVisualGeneration } from "@/lib/ai/image";
import { visualAssetPending } from "@/lib/ai/visual-prompt";
import { TechPackClient } from "@/components/techpack/tech-pack-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TechPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project?.tech_pack) notFound();
  const revisions = getRevisions(id);

  // Self-heal: render any visuals the queue missed (queued, failed, or legacy
  // packs whose assets predate the AI-render queue). Fire-and-forget.
  if (project.universal?.visuals_plan?.some((v) => v.generation === "GENERATIVE" && visualAssetPending(v))) {
    try {
      queueVisualGeneration(id);
    } catch {
      // rendering is best-effort; the UI offers per-asset retry
    }
  }

  return <TechPackClient project={project} revisions={revisions} />;
}
