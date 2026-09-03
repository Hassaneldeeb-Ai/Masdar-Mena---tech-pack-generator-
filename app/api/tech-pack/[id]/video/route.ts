import { NextRequest, NextResponse } from "next/server";
import { getProject, setVideoPath } from "@/lib/db";
import { generateProductVideo } from "@/lib/ai/video";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await generateProductVideo(project);
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Video generation failed" }, { status: 400 });
  }
  if (result.videoPath) setVideoPath(id, result.videoPath);
  return NextResponse.json({ videoPath: result.videoPath, mime: result.mime });
}
