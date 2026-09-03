import { getProvider } from "@/lib/ai/providers";
import { loadPrompt } from "@/lib/ai/providers";
import { readImageInput } from "@/lib/ai/pipeline";
import { buildVisualPrompt, visualAssetPending } from "@/lib/ai/visual-prompt";
import type { TechPack } from "@/lib/schemas/tech-pack";
import path from "node:path";
import fs from "node:fs/promises";

export interface ProductVisualResult {
  ok: boolean;
  message?: string;
  imagePath?: string;
  publicUri?: string;
}

export interface VisualProjectContext {
  id: string;
  image_path?: string | null;
  image_back_path?: string | null;
  tech_pack?: TechPack | null;
  sizes?: string[];
}

const IMAGE_MODEL = process.env.GOOGLE_IMAGE_MODEL ?? "gemini-3.1-flash-image";
const UPLOADS_DIR = path.join(process.cwd(), "public");

/**
 * Generate one visual asset with the Gemini image model.
 *
 * The reference photo is the ground truth for appearance; the per-asset prompt
 * (lib/ai/visual-prompt.ts) grounds the render in the pack's REAL structured
 * data — POM values, tolerances, materials, colourways, construction steps.
 * Saves the result to public/visuals/{projectId}-{assetId}.png.
 */
export async function generateProductVisual(
  project: VisualProjectContext,
  visualType: string
): Promise<ProductVisualResult> {
  const provider = getProvider();
  if (provider.kind !== "llm" || provider.name !== "google" || !process.env.GOOGLE_API_KEY) {
    return {
      ok: false,
      message:
        "AI image generation requires a live Google API key — run with AI_PROVIDER=auto and GOOGLE_API_KEY set.",
    };
  }

  const reference = await readImageInput(UPLOADS_DIR, project.image_path ?? project.image_back_path ?? "");
  if (!reference) {
    return { ok: false, message: "No reference image to work from." };
  }

  const base = await loadPrompt("image");
  const prompt = project.tech_pack
    ? `${base}\n\n${buildVisualPrompt(visualType, { pack: project.tech_pack, sizes: project.sizes ?? [] })}`
    : base;

  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  const response = await client.models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: reference.mime, data: reference.base64 } },
        ],
      },
    ],
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  const imageData = imagePart?.inlineData?.data;

  if (!imageData) {
    return {
      ok: false,
      message:
        "The model returned no image data. The image may have been filtered or the model returned text only — try again.",
    };
  }

  const outDir = path.join(UPLOADS_DIR, "visuals");
  await fs.mkdir(outDir, { recursive: true });
  const fileName = `${project.id}-${visualType}.png`;
  const outPath = path.join(outDir, fileName);
  await fs.writeFile(outPath, Buffer.from(imageData, "base64"));

  return { ok: true, imagePath: outPath, publicUri: `/visuals/${fileName}` };
}

/* ---------- background generation queue (fire-and-forget, server-lifetime) ---------- */

const inflight = new Map<string, Promise<ProductVisualResult>>();
const FAILED = "FAILED";
const GENERATED = "GENERATED";

/**
 * Kick off AI generation for every PLANNED visual asset without blocking the
 * caller. Results are persisted into visuals_plan when they land; failures
 * mark the asset FAILED so the UI can offer a retry.
 */
export function queueVisualGeneration(projectId: string): void {
  const project = getProjectCached(projectId);
  if (!project?.tech_pack || !project.universal) return;
  const planned = (project.universal.visuals_plan ?? []).filter(
    (v) => v.generation === "GENERATIVE" && visualAssetPending(v)
  );
  for (const asset of planned) {
    const key = `${projectId}:${asset.id}`;
    if (inflight.has(key)) continue;
    const job = generateProductVisual(project, asset.id)
      .then((result) => {
        const current = getProjectCached(projectId);
        if (!current?.universal) return result;
        const next = structuredClone(current.universal);
        const target = next.visuals_plan?.find((v) => v.id === asset.id);
        if (target) {
          target.status = result.ok ? GENERATED : FAILED;
          if (result.ok && result.publicUri) target.asset_path = result.publicUri;
          saveUniversal(projectId, next);
        }
        return result;
      })
      .catch((err: unknown): ProductVisualResult => {
        const current = getProjectCached(projectId);
        if (current?.universal) {
          const next = structuredClone(current.universal);
          const target = next.visuals_plan?.find((v) => v.id === asset.id);
          if (target) {
            target.status = FAILED;
            saveUniversal(projectId, next);
          }
        }
        return { ok: false, message: err instanceof Error ? err.message : "Generation failed." };
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, job);
  }
}

/** Lazy import to avoid a cycle: db.ts <-> pipeline.ts. */
import { getProject, saveUniversal } from "@/lib/db";
function getProjectCached(projectId: string) {
  return getProject(projectId);
}
