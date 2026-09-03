import { describe, expect, it } from "vitest";
import { buildVisualPrompt, visualAssetPending, VISUAL_ASSET_IDS } from "@/lib/ai/visual-prompt";
import { analyzeMock } from "@/lib/ai/providers/mock-analysis";
import { generateTechPackMock } from "@/lib/ai/providers/mock-techpack";
import type { CommercialInputs } from "@/lib/ai/pipeline-types";

function ctx() {
  const inputs: CommercialInputs = {
    brand_name: "B",
    name: "Reversible Cotton Bucket Hat",
    description: "Plain reversible bucket hat in cotton twill.",
    quantity: 100,
    sizes: ["S", "M", "L"],
    colorways: [{ name: "Khaki", code: "#C3B091" }],
    demoMode: true,
  };
  const pack = generateTechPackMock(analyzeMock(inputs.description, inputs), inputs);
  return { pack, sizes: inputs.sizes };
}

describe("buildVisualPrompt (AI image generation grounding)", () => {
  it("covers every planned visual asset", () => {
    expect(VISUAL_ASSET_IDS).toContain("va-hero");
    expect(VISUAL_ASSET_IDS).toContain("va-pom");
    expect(VISUAL_ASSET_IDS).toContain("va-materials");
  });

  it("gives every asset an anti-invention rule and an image-only output contract", () => {
    for (const id of VISUAL_ASSET_IDS) {
      const prompt = buildVisualPrompt(id, ctx()).toLowerCase();
      expect(prompt, id).toContain("do not invent");
      expect(prompt, id).toContain("return only");
      expect(prompt, id).toMatch(/omit(ting)? is preferable|omission is preferable/);
    }
  });

  it("grounds the POM diagram in the pack's real measurement values and tolerances", () => {
    const { pack } = ctx();
    const pom = pack.measurements.find((m) => /head/i.test(m.name)) ?? pack.measurements[0];
    const firstSize = Object.keys(pom.values)[0];
    const prompt = buildVisualPrompt("va-pom", ctx());
    expect(prompt).toContain(pom.name);
    expect(prompt).toContain(String(pom.values[firstSize]));
    expect(prompt).toContain(pom.tolerance);
  });

  it("injects the real colorway codes into the material board prompt", () => {
    const { pack } = ctx();
    const prompt = buildVisualPrompt("va-materials", ctx());
    for (const c of pack.colorways) expect(prompt).toContain(c.code);
    expect(prompt).toMatch(/composition|gsm/i);
  });

  it("lists the real numbered construction steps for the assembly prompt", () => {
    const { pack } = ctx();
    const steps = pack.construction.flatMap((s) => s.items);
    const prompt = buildVisualPrompt("va-construction", ctx());
    expect(prompt).toContain(steps[0].split(".")[0].trim().slice(0, 20));
    expect(prompt.toLowerCase()).toContain("reversible");
  });

  it("keeps the hero prompt photographic while technical assets stay drawing-style", () => {
    expect(buildVisualPrompt("va-hero", ctx()).toLowerCase()).toContain("photoreal");
    expect(buildVisualPrompt("va-front", ctx()).toLowerCase()).toContain("technical flat");
    expect(buildVisualPrompt("va-pom", ctx()).toLowerCase()).toContain("dimension");
  });
});

describe("visualAssetPending (stale GENERATED without asset_path must re-render)", () => {
  it("treats GENERATED assets without an asset_path as pending", () => {
    expect(
      visualAssetPending({ id: "va-front", type: "x", status: "GENERATED" })
    ).toBe(true);
  });

  it("treats GENERATED assets with a path, PLANNED and FAILED as pending-true/false correctly", () => {
    expect(
      visualAssetPending({ id: "a", type: "x", status: "GENERATED", asset_path: "/visuals/a.png" })
    ).toBe(false);
    expect(visualAssetPending({ id: "a", type: "x", status: "PLANNED" })).toBe(true);
    expect(visualAssetPending({ id: "a", type: "x", status: "FAILED" })).toBe(true);
    expect(visualAssetPending({ id: "a", type: "x", status: "SKIPPED" })).toBe(false);
  });
});
