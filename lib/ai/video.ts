import { GoogleGenAI } from "@google/genai";
import { getProvider } from "@/lib/ai/providers";
import { loadPrompt } from "@/lib/ai/providers";

export interface VideoResult {
  ok: boolean;
  videoUri?: string;
  mime?: string;
  message?: string;
  videoPath?: string;
}

const VEO_MODEL = process.env.GOOGLE_VIDEO_MODEL ?? "veo-3.1-lite-generate-preview";

async function pollOperation(opName: string, apiKey: string, delayMs = 15000, tries = 12) {
  const base = opName.replace(/^models\//, "models/");
  const url = `https://generativelanguage.googleapis.com/v1beta/${base}?key=${apiKey}`;
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Video operation poll failed (${res.status})`);
    const data = await res.json();
    if (data.done) {
      const samples =
        data?.response?.generateVideoResponse?.generatedSamples ?? data?.response?.generatedVideos ?? [];
      const first = samples[0];
      const uri = first?.video?.uri ?? first?.uri;
      if (!uri) throw new Error("Video operation completed without a video URI");
      return uri;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Video generation timed out — try again in a moment");
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Project } from "@/lib/schemas/tech-pack";

async function readImageAsBase64(project: Project) {
  const { readImageInput } = await import("@/lib/ai/pipeline");
  const img = project.image_path ?? project.image_back_path;
  if (!img) return null;
  try {
    return readImageInput(path.join(process.cwd(), "public"), img);
  } catch {
    return null;
  }
}

/**
 * Generate the 8-second Veo product showcase for a project.
 * Requires a live Google API key (AI_PROVIDER=auto); returns ok:false in mock mode.
 */
export async function generateProductVideo(project: Project): Promise<VideoResult> {
  const provider = getProvider();
  const apiKey = process.env.GOOGLE_API_KEY;
  if (provider.kind !== "llm" || provider.name !== "google" || !apiKey) {
    return {
      ok: false,
      message:
        "Video generation requires a live Google API key — run with AI_PROVIDER=auto and GOOGLE_API_KEY set.",
    };
  }
  try {
    const imagePayload = await readImageAsBase64(project);
    if (!imagePayload) {
      return { ok: false, message: "No reference image on this project — upload a product image first." };
    }
    const client = new GoogleGenAI({ apiKey });
    const textPrompt = await loadPrompt("video");
    const op = await client.models.generateVideos({
      model: VEO_MODEL,
      config: {
        resolution: "720p",
        aspectRatio: "16:9",
        durationSeconds: 8,
      },
      source: {
        prompt: textPrompt,
        image: { imageBytes: imagePayload.base64, mimeType: imagePayload.mime },
      },
    });
    if (!op?.name) return { ok: false, message: "Video generation could not be started." };
    const uri = await pollOperation(op.name, apiKey);
    const dlUrl = new URL(uri);
    dlUrl.searchParams.set("key", apiKey);
    const dataRes = await fetch(dlUrl.toString(), { cache: "no-store" });
    if (!dataRes.ok) throw new Error(`Video download failed (${dataRes.status})`);
    const buf = Buffer.from(await dataRes.arrayBuffer());

    const outDir = path.join(process.cwd(), "public", "videos");
    await mkdir(outDir, { recursive: true });
    const videoPath = `/videos/${project.id}.mp4`;
    await writeFile(path.join(outDir, `${project.id}.mp4`), buf);

    return { ok: true, videoUri: videoPath, mime: dataRes.headers.get("content-type") ?? "video/mp4", videoPath };
  } catch (e) {
    return { ok: false, message: `Video generation failed: ${(e as Error).message}` };
  }
}
