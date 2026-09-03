import { describe, expect, it } from "vitest";
import {
  FieldValueSchema,
  ProjectSchema,
  QaReportSchema,
  TechPackSchema,
} from "@/lib/schemas/tech-pack";

const validFieldValue = {
  value: "100% cotton",
  source: "inferred",
  confidence: 0.82,
  requires_review: true,
};

const validTechPack = {
  version: "V1.0",
  generated_at: new Date().toISOString(),
  review_status: "REVIEW_REQUIRED",
  product: {
    name: "Reversible Cotton Bucket Hat",
    category: "Headwear",
    product_type: "bucket_hat",
    revision: "V1.0",
  },
  materials: [
    {
      id: "M1",
      name: "Outer shell",
      type: "fabric",
      composition: validFieldValue,
    },
  ],
  bom: [
    {
      id: "B1",
      position: 1,
      component_name: "Outer shell",
      material_name: "Outer shell",
      specification: "100% cotton woven",
      unit: "m",
      consumption: 0.35,
      consumption_is_estimated: true,
      color: "Khaki",
    },
  ],
  measurements: [
    {
      id: "A",
      name: "Head opening",
      how_to_measure: "Measure inside circumference at the head opening seam.",
      unit: "cm",
      tolerance: "+/- 0.5",
      values: { S: 56, M: 58, L: 60 },
      source: "inferred",
      confidence: 0.7,
      requires_review: true,
    },
  ],
  construction: [{ section: "General", items: ["Cut and sew." ] }],
  stitching: {
    primary_stitch: "Lockstitch (301)",
    source: "inferred",
    confidence: 0.68,
    requires_review: true,
  },
  colorways: [
    {
      id: "CW1",
      number: 1,
      name: "Khaki",
      code: "#C3B091",
      face_a: "Khaki",
      face_b: "Black",
      reversible: true,
    },
  ],
  labels: [{ id: "L1", name: "Brand label", type: "woven", required: true }],
  quality_control: [
    { id: "QC1", category: "Fabric", check: "No holes or stains." },
  ],
  packaging: [
    { id: "PK1", item: "Polybag", spec: "PE 50 micron", unit: "pcs", quantity: "1" },
  ],
  assumptions: [
    {
      id: "AS1",
      statement: "Measurements proposed from size norms.",
      category: "measurements",
      confidence: 0.6,
      impact: "medium",
      required_action: "Confirm at sample stage.",
    },
  ],
  warnings: [],
};

describe("Field value provenance schema", () => {
  it("accepts a well-formed provenance field", () => {
    const parsed = FieldValueSchema.parse(validFieldValue);
    expect(parsed.source).toBe("inferred");
    expect(parsed.requires_review).toBe(true);
  });

  it("rejects a source outside the provenance enum", () => {
    expect(() =>
      FieldValueSchema.parse({ ...validFieldValue, source: "guessed" })
    ).toThrow();
  });

  it("rejects confidence outside 0..1", () => {
    expect(() =>
      FieldValueSchema.parse({ ...validFieldValue, confidence: 1.5 })
    ).toThrow();
  });
});

describe("TechPackSchema", () => {
  it("parses a complete AI-generated pack", () => {
    const parsed = TechPackSchema.parse(validTechPack);
    expect(parsed.product.name).toBe("Reversible Cotton Bucket Hat");
    expect(parsed.materials[0].composition.source).toBe("inferred");
  });

  it("rejects a pack with a missing product block", () => {
    const broken = { ...validTechPack } as Record<string, unknown>;
    delete broken.product;
    expect(() => TechPackSchema.parse(broken)).toThrow();
  });

  it("rejects a BOM item without a component name", () => {
    const broken = structuredClone(validTechPack) as typeof validTechPack;
    delete (broken.bom[0] as { component_name?: string }).component_name;
    expect(() => TechPackSchema.parse(broken)).toThrow();
  });
});

describe("QaReportSchema", () => {
  it("parses a deterministic QA report", () => {
    const parsed = QaReportSchema.parse({
      blocking_errors: [],
      warnings: [],
      info: [],
      checks_passed: 20,
      checks_total: 23,
      overall_score: 85,
      completeness_pct: 87,
      recommendations: ["Confirm fabric GSM."],
    });
    expect(parsed.checks_total).toBe(23);
  });

  it("rejects an issue with an unknown level", () => {
    expect(() =>
      QaReportSchema.parse({
        blocking_errors: [{ code: "x", level: "fatal", message: "boom" }],
        warnings: [],
        info: [],
        checks_passed: 0,
        checks_total: 1,
        overall_score: 0,
        completeness_pct: 0,
        recommendations: [],
      })
    ).toThrow();
  });
});

describe("ProjectSchema", () => {
  it("parses a full persisted project with embedded pack and QA", () => {
    const parsed = ProjectSchema.parse({
      id: "p1",
      name: "Reversible Cotton Bucket Hat",
      description: "Demo hat",
      sizes: ["S", "M", "L"],
      colorways: [{ name: "Khaki", code: "#C3B091" }],
      status: "REVIEW_REQUIRED",
      analysis: {
        product_type: "bucket_hat",
        category: "Headwear",
        silhouette: "Unstructured bucket",
        reversible: true,
        construction: "Cut and sew, two-layer reversible.",
        components: [
          { id: "C1", name: "Crown", count: 1, function: "Head coverage", source: "observed", confidence: 0.9 },
          { id: "C2", name: "Brim", count: 1, function: "Shade", source: "observed", confidence: 0.9 },
        ],
        material_indicators: [
          { name: "Cotton", type: "fabric", source: "inferred", confidence: 0.82 },
        ],
        seam_indicators: [],
        hardware: [],
        features: [],
        label_observations: [],
        colors: [{ name: "Khaki" }],
        observable_details: ["Visible topstitching on the brim."],
        missing_from_image: ["Fabric GSM"],
        confidence: { overall: 0.68, product_type: 0.9, construction: 0.6, materials: 0.7 },
      },
      tech_pack: validTechPack,
      qa_report: {
        blocking_errors: [],
        warnings: [],
        info: [],
        checks_passed: 20,
        checks_total: 23,
        overall_score: 85,
        completeness_pct: 87,
        recommendations: [],
      },
      version: "V1.0",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    expect(parsed.tech_pack?.product.category).toBe("Headwear");
  });
});
