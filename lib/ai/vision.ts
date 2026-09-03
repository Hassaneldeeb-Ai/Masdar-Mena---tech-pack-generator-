import { z } from "zod";
import {
  ProductAnalysisSchema,
  type ProductAnalysis,
} from "@/lib/schemas/tech-pack";
import { loadPrompt } from "./providers";
import { analyzeMock } from "./providers/mock-analysis";
import { getProvider } from "./providers";
import type { CommercialInputs } from "./pipeline-types";

export interface ImageInput {
  base64: string;
  mime: string;
}

/** Stage 1: image + description -> structured product analysis. */
export async function analyzeProduct(
  inputs: CommercialInputs,
  image?: ImageInput,
  imageBack?: ImageInput
): Promise<ProductAnalysis> {
  const resolved = getProvider();
  if (resolved.kind === "mock") {
    return analyzeMock(inputs.description, inputs);
  }
  const system = await loadPrompt("vision");
  const schemaJson = JSON.stringify(z.toJSONSchema(ProductAnalysisSchema), null, 2);
  const prompt = [
    `# Buyer description`,
    inputs.description,
    ``,
    `# Buyer inputs`,
    JSON.stringify(
      {
        category: inputs.category,
        brand: inputs.brand_name,
        colorways: inputs.colorways,
      },
      null,
      2
    ),
    ``,
    `# Image`,
    image
      ? imageBack
        ? "Two images are attached: the FRONT view, then the BACK view of the same product."
        : "The image is attached to this message."
      : imageBack
        ? "One image is attached: the BACK view of the product."
        : "No image available.",
    ``,
    `# JSON schema`,
    schemaJson,
  ].join("\n");

  const raw = await resolved.provider!.jsonComplete({
    system,
    prompt,
    image,
    imageBack,
  });
  const parsed = ProductAnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const repair = await resolved.provider!.jsonComplete({
      system,
      prompt: `${prompt}\n\nYour previous response was invalid JSON per the schema. Fix and re-return the complete object. Errors: ${messages}`,
      image,
    });
    const repaired = ProductAnalysisSchema.safeParse(repair);
    if (!repaired.success) {
      throw new Error(
        `Vision stage returned invalid data after repair: ${repaired.error.issues
          .slice(0, 5)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`
      );
    }
    return repaired.data;
  }
  return parsed.data;
}
