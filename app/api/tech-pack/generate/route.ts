import { NextRequest } from "next/server";
import { getProject } from "@/lib/db";
import { readImageInput, runPipeline } from "@/lib/ai/pipeline";
import type { CommercialInputs } from "@/lib/ai/pipeline-types";
import path from "node:path";

export const runtime = "nodejs";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Generate a tech pack for a project. Streams stage events as newline-delimited
 * JSON so the UI can animate the pipeline, then emits the final result.
 */
export async function POST(req: NextRequest) {
  const { projectId } = await req.json().catch(() => ({}));
  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }
  const project = getProject(projectId);
  if (!project) return new Response("Not found", { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(new TextEncoder().encode(JSON.stringify(payload) + "\n"));
      try {
        send({ type: "stage", stage: "vision", done: false });
        const image = project.image_path
          ? await readImageInput(UPLOADS_DIR, project.image_path.replace("/uploads/", ""))
          : undefined;
        const imageBack = project.image_back_path
          ? await readImageInput(UPLOADS_DIR, project.image_back_path.replace("/uploads/", ""))
          : undefined;
        const inputs: CommercialInputs = {
          brand_name: project.brand_name,
          name: project.name,
          category: project.category,
          description: project.description,
          intended_customer: project.intended_customer,
          target_market: project.target_market,
          quantity: project.quantity,
          sizes: project.sizes,
          colorways: project.colorways,
          notes: project.notes,
        };
        const result = await runPipeline(inputs, image, projectId, imageBack);
        send({ type: "stage", stage: "pack", done: false });
        send({ type: "stage", stage: "ready", done: true });
        send({ type: "done", projectId, provider: result.provider, qaReport: result.qaReport });
      } catch (err) {
        const raw = err instanceof Error ? err.message : "Generation failed";
        send({
          type: "error",
          message: /JSON|Unexpected|parse|SyntaxError/i.test(raw)
            ? "The AI returned an unparsable response. Please try again — if it repeats, retry with the mock engine (AI_PROVIDER=mock) or another provider."
            : raw,
        });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
