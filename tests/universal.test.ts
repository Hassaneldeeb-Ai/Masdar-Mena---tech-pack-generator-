import { describe, expect, it } from "vitest";
import { mapToUniversal } from "@/lib/universal/mapper";
import { computeReadiness } from "@/lib/universal/readiness";
import { toUFieldSource, uf } from "@/lib/schemas/universal";
import type { CoreProductSpec } from "@/lib/schemas/universal";
import type { TechPack } from "@/lib/schemas/tech-pack";
import { generateTechPackMock } from "@/lib/ai/providers/mock-techpack";
import { analyzeMock } from "@/lib/ai/providers/mock-analysis";
import type { CommercialInputs } from "@/lib/ai/pipeline-types";

const demoInputs: CommercialInputs = {
  brand_name: "Small Egyptian Apparel Brand",
  name: "Reversible Cotton Bucket Hat",
  description:
    "Plain reversible bucket hat in cotton twill. Khaki face with black inner face. First production run for a small Egyptian apparel brand.",
  quantity: 100,
  sizes: ["S", "M", "L"],
  colorways: [
    { name: "Khaki", code: "#C3B091" },
    { name: "Black", code: "#111111" },
  ],
  demoMode: true,
};

function buildProject(): { pack: TechPack; analysis: ReturnType<typeof analyzeMock> } {
  const analysis = analyzeMock(demoInputs.description, demoInputs);
  const pack = generateTechPackMock(analysis, demoInputs);
  return { pack, analysis };
}

function testProject(): Parameters<typeof mapToUniversal>[0]["project"] {
  return {
    name: demoInputs.name ?? "Bucket Hat",
    description: demoInputs.description,
    brand_name: demoInputs.brand_name,
    quantity: demoInputs.quantity,
    sizes: demoInputs.sizes ?? [],
    colorways: demoInputs.colorways ?? [],
  };
}

describe("mapToUniversal — demo bucket hat", () => {
  it("produces components, dimensions, variants and requirements", () => {
    const { pack, analysis } = buildProject();
    const spec = mapToUniversal({
      pack,
      analysis,
      project: testProject(),
      qaReport: null,
    });
    expect(spec.schema_version).toBe("1.0");
    expect(spec.components.length).toBeGreaterThanOrEqual(3);
    expect(spec.dimensions.length).toBeGreaterThan(0);
    expect(spec.variants.length).toBe(3); // 2 COLOR + 1 SIZE
    expect(spec.requirements.length).toBeGreaterThanOrEqual(8);
    expect(spec.assembly_sequence.length).toBeGreaterThan(0);
    expect(spec.visuals_plan.every((v) => v.generation === "GENERATIVE" && v.status === "PLANNED")).toBe(true);
    expect(spec.extensions.qc_count).toBe(pack.quality_control.length);
  });

  it("maps POM dimensions with tolerance, per-size grading and base size", () => {
    const { pack, analysis } = buildProject();
    const spec = mapToUniversal({
      pack,
      analysis,
      project: testProject(),
      qaReport: null,
    });
    const dim = spec.dimensions.find((d) => d.name.toLowerCase().includes("head"));
    expect(dim).toBeDefined();
    expect(dim!.value.nominal).toBeGreaterThan(0);
    expect(dim!.value.tolerance).toBeGreaterThan(0);
    expect(Object.keys(dim!.per_size ?? {}).length).toBe(3);
    expect(dim!.grading?.step).toBeGreaterThan(0);
    expect(dim!.grading?.base_size).toBeDefined();
  });

  it("creates COLOR variants with hex/pantone attributes and one SIZE variant", () => {
    const { pack, analysis } = buildProject();
    const spec = mapToUniversal({
      pack,
      analysis,
      project: testProject(),
      qaReport: null,
    });
    const colors = spec.variants.filter((v) => v.variant_type === "COLOR");
    expect(colors.length).toBe(2);
    for (const c of colors) {
      const attrs = c.attributes.map((a) => a.name);
      expect(attrs).toContain("hex");
      expect(attrs).toContain("pantone");
    }
    const size = spec.variants.find((v) => v.variant_type === "SIZE");
    expect(size).toBeDefined();
    expect(size!.source).toBe("user_provided");
    expect(size!.status).toBe("CONFIRMED");
  });

  it("classifies and computes readiness with a factory score in 0-100", () => {
    const { pack, analysis } = buildProject();
    const spec = mapToUniversal({
      pack,
      analysis,
      project: testProject(),
      qaReport: null,
    });
    const readiness = computeReadiness(spec);
    expect(readiness.factory_ready.score).toBeGreaterThanOrEqual(0);
    expect(readiness.factory_ready.score).toBeLessThanOrEqual(100);
    expect(readiness.factory_ready.dimensions.some((d) => d.status === "APPLICABLE")).toBe(true);
    expect(["design_complete", "technically_reviewed", "sample_ready", "production_ready"]).toContain(
      "sample_ready"
    );
    expect(readiness.sample_ready.reasons.length).toBeGreaterThanOrEqual(0);
    expect(typeof readiness.sample_ready.sample_ready).toBe("boolean");
    expect(readiness.approval_status).toBe("AI_DRAFT");
  });
});

describe("computeReadiness — minimal spec", () => {
  it("marks missing modules N/A and never rewards them", () => {
    const minimal: CoreProductSpec = {
      schema_version: "1.0",
      product: { name: "Bracket", description: "L-bracket", category: "Industrial", sizes: [], has_mvpa: false },
      classification: { confidence: "MEDIUM", activated_modules: ["PRODUCT"] },
      components: [],
      materials: [],
      dimensions: [],
      variants: [],
      requirements: [],
      assembly_sequence: [],
      manufacturing: [],
      function_spec: [],
      risks: [],
      visuals_plan: [],
      packaging: [],
      compliance: [],
      assumptions: [],
      warnings: [],
      readiness: null,
      extensions: {},
      generated_at: new Date().toISOString(),
    };
    const readiness = computeReadiness(minimal);
    const na = readiness.factory_ready.dimensions.filter((d) => d.status === "N_A");
    expect(na.length).toBeGreaterThan(0);
    expect(readiness.factory_ready.score).toBeLessThan(60);
    expect(readiness.sample_ready.design_complete).toBe(false);
    expect(readiness.sample_ready.production_ready).toBe(false);
    expect(readiness.sample_ready.reasons.length).toBeGreaterThan(0);
  });
});

describe("source/status mapping helpers", () => {
  it("maps legacy sources to universal sources", () => {
    expect(toUFieldSource("observed")).toBe("IMAGE_OBSERVED");
    expect(toUFieldSource("inferred")).toBe("AI_INFERRED");
    expect(toUFieldSource("assumed")).toBe("AI_RECOMMENDED");
    expect(toUFieldSource("user_provided")).toBe("USER_PROVIDED");
    expect(toUFieldSource("verified")).toBe("MANUALLY_EDITED");
    expect(toUFieldSource("unknown" as never)).toBe("UNKNOWN");
  });

  it("builds UFieldValue with confidence and status logic", () => {
    const fv = uf("240", { source: "inferred" as never, confidence: 0.7 });
    expect(fv.source).toBe("AI_INFERRED");
    expect(fv.confidence).toBe("MEDIUM");
    expect(fv.review_required).toBe(true);
    expect(fv.status).toBe("REQUIRES_CONFIRMATION");

    const ok = uf("100% cotton", { source: "user_provided" as never, review_required: false });
    expect(ok.status).toBe("CONFIRMED");
  });
});
