import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createProject } from "@/lib/db";
import { readImageInput, runPipeline } from "@/lib/ai/pipeline";

export const runtime = "nodejs";

const DEMO_IMAGE = "demo-bucket-hat.png";

/**
 * One-click demo: creates a project from the supplied test case, runs the full
 * pipeline and returns the project id so the demo lands on a real tech pack.
 */
export async function POST() {
  const id = randomUUID();
  createProject({
    id,
    name: "Reversible Cotton Bucket Hat",
    description: [
      "Plain cotton bucket hat for a small Egyptian apparel brand's first production run.",
      "",
      "The hat is fully reversible and should work as a two-sided product.",
      "One colorway is khaki and the other is black.",
      "",
      "Keep the construction simple, durable and suitable for everyday casual wear.",
    ].join("\n"),
    brand_name: "Small Egyptian Apparel Brand",
    image_path: `/${DEMO_IMAGE}`,
    category: "headwear",
    quantity: 100,
    sizes: ["S", "M", "L"],
    colorways: [
      { name: "Khaki", code: "#C3B091" },
      { name: "Black", code: "#111111" },
    ],
    notes: "First production run. Prototype assumption: 100 units.",
  });

  const image = await readImageInput(
    `${process.cwd()}/public`,
    DEMO_IMAGE
  );
  await runPipeline(
    {
      brand_name: "Small Egyptian Apparel Brand",
      name: "Reversible Cotton Bucket Hat",
      category: "headwear",
      description: [
        "Plain cotton bucket hat for a small Egyptian apparel brand's first production run.",
        "",
        "The hat is fully reversible and should work as a two-sided product.",
        "One colorway is khaki and the other is black.",
        "",
        "Keep the construction simple, durable and suitable for everyday casual wear.",
      ].join("\n"),
      quantity: 100,
      sizes: ["S", "M", "L"],
      colorways: [
        { name: "Khaki", code: "#C3B091" },
        { name: "Black", code: "#111111" },
      ],
      notes: "First production run. Prototype assumption: 100 units.",
      demoMode: true,
    },
    image,
    id
  );

  return NextResponse.json({ id });
}
