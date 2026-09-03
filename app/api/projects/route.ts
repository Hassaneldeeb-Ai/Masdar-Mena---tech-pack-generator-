import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createProject } from "@/lib/db";

export const runtime = "nodejs";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

/** Create a project (multipart form): image file + buyer inputs. */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const image = form.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Product image is required." }, { status: 400 });
  }
  if (!ALLOWED.has(image.type)) {
    return NextResponse.json(
      { error: `Unsupported image type ${image.type}. Allowed: JPG, PNG, WEBP.` },
      { status: 415 }
    );
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8 MB." }, { status: 413 });
  }

  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!name || !description) {
    return NextResponse.json({ error: "Product name and description are required." }, { status: 400 });
  }

  const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const id = randomUUID();
  const fileName = `${id}.${ext}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, fileName), Buffer.from(await image.arrayBuffer()));

  // Optional back-view image — improves vision analysis for two-sided products.
  const backImage = form.get("image_back");
  let backPath: string | undefined;
  if (backImage instanceof File && backImage.size > 0) {
    if (!ALLOWED.has(backImage.type)) {
      return NextResponse.json(
        { error: `Unsupported back image type ${backImage.type}. Allowed: JPG, PNG, WEBP.` },
        { status: 415 }
      );
    }
    if (backImage.size > MAX_BYTES) {
      return NextResponse.json({ error: "Back image must be under 8 MB." }, { status: 413 });
    }
    const backExt =
      backImage.type === "image/png" ? "png" : backImage.type === "image/webp" ? "webp" : "jpg";
    backPath = `/uploads/${id}-back.${backExt}`;
    await writeFile(
      path.join(UPLOADS_DIR, `${id}-back.${backExt}`),
      Buffer.from(await backImage.arrayBuffer())
    );
  }

  let sizes: string[] = [];
  let colorways: Array<{ name: string; code?: string }> = [];
  try {
    sizes = JSON.parse(String(form.get("sizes") ?? "[]"));
    colorways = JSON.parse(String(form.get("colorways") ?? "[]"));
  } catch {
    return NextResponse.json({ error: "Invalid sizes or colorways payload." }, { status: 400 });
  }

  const quantityRaw = String(form.get("quantity") ?? "");
  const quantity = quantityRaw ? Number(quantityRaw) : undefined;

  createProject({
    id,
    name,
    description,
    brand_name: String(form.get("brand") ?? "") || undefined,
    image_path: `/uploads/${fileName}`,
    image_back_path: backPath,
    category: String(form.get("category") ?? "") || undefined,
    intended_customer: String(form.get("intended_customer") ?? "") || undefined,
    target_market: String(form.get("target_market") ?? "") || undefined,
    quantity: quantity && Number.isFinite(quantity) ? quantity : undefined,
    sizes,
    colorways,
    notes: String(form.get("notes") ?? "") || undefined,
  });

  return NextResponse.json({ id, status: "DRAFT" });
}
