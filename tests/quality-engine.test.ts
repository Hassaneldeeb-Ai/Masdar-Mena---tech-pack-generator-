import { beforeEach, describe, expect, it } from "vitest";
import { runQaChecks } from "@/lib/quality/engine";
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

function buildDemoPack(): TechPack {
  const analysis = analyzeMock(demoInputs.description, demoInputs);
  return generateTechPackMock(analysis, demoInputs);
}

let pack: TechPack;

beforeEach(() => {
  pack = buildDemoPack();
});

describe("runQaChecks — demo bucket hat pack", () => {
  it("classifies category as Headwear for a bucket hat", () => {
    expect(pack.product.category.toLowerCase()).toContain("head");
  });

  it("detects reversibility from the description", () => {
    expect(pack.colorways.some((c) => c.face_b)).toBe(true);
  });

  it("produces two colorways with distinct faces", () => {
    expect(pack.colorways.length).toBe(2);
    expect(pack.colorways[0].face_a).not.toBe(pack.colorways[0].face_b);
  });

  it("covers every declared size at every POM point (no blocking errors)", () => {
    const qa = runQaChecks({ techPack: pack, sizes: ["S", "M", "L"], quantity: 100 });
    expect(qa.blocking_errors).toHaveLength(0);
    for (const m of pack.measurements) {
      expect(m.values.S).toBeDefined();
      expect(m.values.M).toBeDefined();
      expect(m.values.L).toBeDefined();
    }
  });

  it("flags missing fabric GSM as a warning with supplier guidance", () => {
    const qa = runQaChecks({ techPack: pack, sizes: ["S", "M", "L"], quantity: 100 });
    const gsm = qa.warnings.find((w) => w.code === "fabric_gsm_missing");
    expect(gsm).toBeDefined();
    expect(gsm?.level).toBe("warning");
  });
});

describe("runQaChecks — blocking rules", () => {
  it("blocks export when a declared size has no graded values", () => {
    const broken = structuredClone(pack);
    delete broken.measurements[0].values.XL;
    const qa = runQaChecks({ techPack: broken, sizes: ["S", "M", "L", "XL"], quantity: 100 });
    const sizeErr = qa.blocking_errors.find(
      (e) => e.code === "measurements_cover_all_sizes"
    );
    expect(sizeErr).toBeDefined();
    expect(sizeErr?.message).toContain("XL");
  });

  it("blocks when a reversible pack has fewer than two shell layers in the BOM", () => {
    const broken = structuredClone(pack);
    broken.bom = broken.bom.filter(
      (b) => !/inner|lining|shell/i.test(b.component_name)
    );
    const qa = runQaChecks({ techPack: broken, sizes: ["S", "M", "L"], quantity: 100 });
    expect(
      qa.blocking_errors.some((e) => e.code === "reversible_two_layers")
    ).toBe(true);
  });

  it("blocks when the product name is missing and caps the score below 50", () => {
    const broken = structuredClone(pack);
    broken.product.name = "";
    const qa = runQaChecks({ techPack: broken, sizes: ["S", "M", "L"], quantity: 100 });
    expect(qa.blocking_errors.some((e) => e.code === "required_product_name")).toBe(
      true
    );
    expect(qa.overall_score).toBeLessThan(50);
  });

  it("blocks when stitching specification is removed", () => {
    const broken = structuredClone(pack);
    broken.stitching.primary_stitch = "";
    const qa = runQaChecks({ techPack: broken, sizes: ["S", "M", "L"], quantity: 100 });
    expect(qa.blocking_errors.some((e) => e.code === "required_stitching")).toBe(
      true
    );
  });
});

describe("runQaChecks — adversarial cases", () => {
  it("flags a reversible colorway whose two faces are the same colour", () => {
    const broken = structuredClone(pack);
    broken.colorways[0].face_b = broken.colorways[0].face_a;
    const qa = runQaChecks({ techPack: broken, sizes: ["S", "M", "L"], quantity: 100 });
    expect(qa.warnings.some((w) => w.code === "colorway_faces_differ")).toBe(true);
  });

  it("warns when reversibility comes only from the description, not a verifiable two-layer construction section", () => {
    const broken = structuredClone(pack);
    broken.construction = broken.construction.filter(
      (s) => !/revers/i.test(s.section)
    );
    const qa = runQaChecks({ techPack: broken, sizes: ["S", "M", "L"], quantity: 100 });
    expect(
      qa.warnings.some((w) => w.code === "reversible_construction_section")
    ).toBe(true);
  });

  it("warns when a measurement value is outside a plausible garment range", () => {
    const broken = structuredClone(pack);
    broken.measurements[0].values.M = 500;
    const qa = runQaChecks({ techPack: broken, sizes: ["S", "M", "L"], quantity: 100 });
    expect(qa.warnings.some((w) => w.code === "measurement_ranges_sane")).toBe(true);
  });

  it("does not flag normal circumference measurements up to 160", () => {
    const broken = structuredClone(pack);
    broken.measurements[0].values.M = 120;
    const qa = runQaChecks({ techPack: broken, sizes: ["S", "M", "L"], quantity: 100 });
    expect(qa.warnings.some((w) => w.code === "measurement_ranges_sane")).toBe(false);
  });

  it("scores an all-passing pack at 100", () => {
    const complete = structuredClone(pack);
    for (const m of complete.measurements) {
      m.requires_review = false;
    }
    for (const mat of complete.materials) {
      if (mat.type === "fabric") {
        mat.gsm = { value: "240", source: "user_provided", confidence: 1, requires_review: false };
      }
      mat.composition = { ...mat.composition, source: "user_provided", requires_review: false };
    }
    for (const b of complete.bom) b.consumption_is_estimated = false;
    for (const l of complete.labels) l.placement = "Centered on brim";
    complete.quality_control = complete.quality_control.length
      ? complete.quality_control
      : [{ id: "QCX", category: "General", check: "Final inspection." }];
    const qa = runQaChecks({ techPack: complete, sizes: ["S", "M", "L"], quantity: 100 });
    expect(qa.blocking_errors).toHaveLength(0);
    expect(qa.completeness_pct).toBe(100);
  });

  it("reports completeness as passed/total", () => {
    const qa = runQaChecks({ techPack: pack, sizes: ["S", "M", "L"], quantity: 100 });
    expect(qa.checks_total).toBeGreaterThan(0);
    expect(qa.completeness_pct).toBe(
      Math.round((qa.checks_passed / qa.checks_total) * 100)
    );
  });
});
