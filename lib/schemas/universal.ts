import { z } from "zod";

/**
 * Universal product model — category-agnostic core.
 * Category-specific data lives in `extensions` as a validated overlay
 * (e.g. the legacy TechPack is the `apparel` extension).
 * Never add category-specific fields to the core.
 */

export const UFieldSourceSchema = z.enum([
  "USER_PROVIDED",
  "IMAGE_OBSERVED",
  "DOCUMENT_EXTRACTED",
  "AI_INFERRED",
  "AI_RECOMMENDED",
  "REFERENCE_STANDARD",
  "MANUALLY_EDITED",
  "UNKNOWN",
]);

/** Confidence band per spec: LOW / MEDIUM / HIGH (+ EXPLAINED via note). */
export const UConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const UStatusSchema = z.enum([
  "CONFIRMED",
  "REQUIRES_CONFIRMATION",
  "TBD",
  "N/A",
]);

export const UFieldValueSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  source: UFieldSourceSchema,
  confidence: UConfidenceSchema,
  status: UStatusSchema,
  review_required: z.boolean(),
  note: z.string().optional(),
});
export type UFieldValue = z.infer<typeof UFieldValueSchema>;

export const MVPSourceSchema = z.enum([
  "observed",
  "inferred",
  "assumed",
  "user_provided",
  "verified",
  "document_extracted",
  "reference_standard",
  "manually_edited",
  "unknown",
]);
export type MVPSource = z.infer<typeof MVPSourceSchema>;

/** Map a legacy MVP provenance value onto the universal enum. */
export function toUFieldSource(source: string): UFieldValue["source"] {
  const map: Record<string, UFieldValue["source"]> = {
    observed: "IMAGE_OBSERVED",
    inferred: "AI_INFERRED",
    assumed: "AI_RECOMMENDED",
    user_provided: "USER_PROVIDED",
    verified: "MANUALLY_EDITED",
    document_extracted: "DOCUMENT_EXTRACTED",
    reference_standard: "REFERENCE_STANDARD",
    manually_edited: "MANUALLY_EDITED",
    unknown: "UNKNOWN",
  };
  return map[source] ?? "UNKNOWN";
}

export function uf(
  value: UFieldValue["value"],
  opts: {
    source?: UFieldValue["source"] | "observed" | "inferred" | "assumed" | "user_provided" | "verified" | "document_extracted" | "reference_standard" | "manually_edited" | "unknown";
    confidence?: z.infer<typeof UConfidenceSchema> | number;
    review_required?: boolean;
    note?: string;
  } = {}
): UFieldValue {
  const conf =
    typeof opts.confidence === "number"
      ? opts.confidence >= 0.8
        ? "HIGH"
        : opts.confidence >= 0.55
          ? "MEDIUM"
          : "LOW"
      : opts.confidence ?? "MEDIUM";
  return {
    value,
    source: opts.source ? toUFieldSource(opts.source) : "UNKNOWN",
    confidence: conf,
    status: opts.review_required === false ? "CONFIRMED" : "REQUIRES_CONFIRMATION",
    review_required: opts.review_required ?? true,
    ...(opts.note ? { note: opts.note } : {}),
  };
}

/* ------------------------------------------------------------------ */

export const CoreComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(), // ENCLOSURE, BODY, HANDLE, CLOSURE, PCB, FRAME...
  parent_id: z.string().nullish(),
  function: z.string().nullish(),
  material_ref: z.string().nullish(), // materials.id
  relationship: z.string().nullish(),
  position: z.string().nullish(),
  source: MVPSourceSchema,
  confidence: UConfidenceSchema,
  status: UStatusSchema,
  review_required: z.boolean(),
  notes: z.string().optional(),
});
export type CoreComponent = z.infer<typeof CoreComponentSchema>;

/** Universal dimension system (spec §16). */
export const UDimensionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "HEIGHT",
    "WIDTH",
    "DEPTH",
    "DIAMETER",
    "RADIUS",
    "ANGLE",
    "CIRCUMFERENCE",
    "THICKNESS",
    "CLEARANCE",
    "WEIGHT",
    "VOLUME",
    "CAPACITY",
    "LENGTH",
    "OTHER",
  ]),
  unit: z.string(),
  value: z.object({
    nominal: z.number(),
    min: z.number().optional(),
    max: z.number().optional(),
    tolerance: z.number().optional(),
  }),
  per_size: z.record(z.string(), z.number()).optional(),
  grading: z
    .object({
      base_size: z.string().nullish(),
      step: z.number().nullish(),
      span: z.number().nullish(),
    })
    .optional(),
  method: z.string().nullish(),
  reference_component: z.string().nullish(),
  source: MVPSourceSchema,
  confidence: UConfidenceSchema,
  status: UStatusSchema,
  review_required: z.boolean(),
  note: z.string().optional(),
});
export type UDimension = z.infer<typeof UDimensionSchema>;

export const UVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  variant_type: z.enum([
    "COLOR",
    "SIZE",
    "MATERIAL",
    "FINISH",
    "CONFIGURATION",
    "CAPACITY",
    "MODEL",
    "REGION",
    "VOLTAGE",
    "COMPONENT_OPTION",
    "OTHER",
  ]),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })).default([]),
  specification_differences: z.array(z.string()).default([]),
  visual_asset_ref: z.string().nullish(),
  source: MVPSourceSchema,
  confidence: UConfidenceSchema,
  status: UStatusSchema,
  review_required: z.boolean(),
});
export type UVariant = z.infer<typeof UVariantSchema>;

export const URequirementSchema = z.object({
  id: z.string(),
  category: z.enum([
    "PRODUCT",
    "MATERIAL",
    "DIMENSION",
    "FUNCTION",
    "MANUFACTURING",
    "QUALITY",
    "PACKAGING",
    "COMPLIANCE",
    "BRAND",
    "USER",
    "PERFORMANCE",
    "SAFETY",
  ]),
  statement: z.string(),
  target: z.string().nullish(),
  tolerance: z.string().nullish(),
  priority: z.enum(["P1", "P2", "P3"]),
  status: z.enum(["PASS", "FAIL", "WARNING", "MISSING", "REVIEW", "N/A"]),
  verification_method: z.string().nullish(),
  source: MVPSourceSchema,
  traceability: z
    .object({
      component_ids: z.array(z.string()).default([]),
      dimension_ids: z.array(z.string()).default([]),
      qc_ids: z.array(z.string()).default([]),
    })
    .default({ component_ids: [], dimension_ids: [], qc_ids: [] }),
  note: z.string().optional(),
});
export type URequirement = z.infer<typeof URequirementSchema>;

export const AssemblyOperationSchema = z.object({
  id: z.string(),
  step: z.number(),
  operation: z.enum([
    "CUT",
    "SEW",
    "WELD",
    "GLUE",
    "SCREW",
    "PRESS",
    "MOLD",
    "FORM",
    "BEND",
    "FOLD",
    "CONNECT",
    "SOLDER",
    "FASTEN",
    "STITCH",
    "ASSEMBLE",
    "CALIBRATE",
    "TEST",
    "FINISH",
    "OTHER",
  ]),
  description: z.string(),
  components: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  machine: z.string().nullish(),
  parameters: z.string().nullish(),
  critical_instruction: z.string().nullish(),
  qc_checkpoint: z.string().nullish(),
  duration_min: z.number().nullish(),
  section: z.string().nullish(),
});
export type AssemblyOperation = z.infer<typeof AssemblyOperationSchema>;

export const ManufacturingRequirementSchema = z.object({
  id: z.string(),
  process: z.string().nullish(),
  machine: z.string().nullish(),
  tool: z.string().nullish(),
  parameter: z.string().nullish(),
  tolerance: z.string().nullish(),
  sequence: z.number().nullish(),
  operator_instruction: z.string().nullish(),
  inspection: z.string().nullish(),
  safety: z.string().nullish(),
});
export type ManufacturingRequirement = z.infer<typeof ManufacturingRequirementSchema>;

export const FunctionSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  target: z.string().nullish(),
  input: z.string().nullish(),
  output: z.string().nullish(),
  limit: z.string().nullish(),
  test_method: z.string().nullish(),
  acceptance_criteria: z.string().nullish(),
  status: z.enum(["MEASURED", "SPECIFIED", "ESTIMATED", "NOT_PROVIDED"]),
  source: MVPSourceSchema,
});
export type FunctionSpec = z.infer<typeof FunctionSpecSchema>;

export const RiskSchema = z.object({
  id: z.string(),
  description: z.string(),
  cause: z.string().nullish(),
  probability: z.enum(["LOW", "MEDIUM", "HIGH"]),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  mitigation: z.string().nullish(),
  status: z.enum(["OPEN", "MITIGATED", "CLOSED"]).default("OPEN"),
  source: MVPSourceSchema,
});
export type URisks = z.infer<typeof RiskSchema>;

export const VisualAssetPlanSchema = z.object({
  id: z.string(),
  type: z.string(), // TECHNICAL_DRAWING, ANATOMY, DIMENSION, MATERIAL_BOARD...
  purpose: z.string(),
  generation: z.enum(["GENERATIVE", "PROCEDURAL"]),
  status: z.enum(["PLANNED", "GENERATED", "SKIPPED", "FAILED"]).default("PLANNED"),
  associated_entities: z.array(z.string()).default([]),
  note: z.string().optional(),
  asset_path: z.string().optional(),
});
export type VisualAssetPlan = z.infer<typeof VisualAssetPlanSchema>;

export const ComplianceSpecSchema = z.object({
  id: z.string(),
  requirement: z.string(),
  standard: z.string().nullish(),
  region: z.string().nullish(),
  status: z.enum(["APPLICABLE", "NOT_APPLICABLE", "UNVERIFIED"]),
  source: MVPSourceSchema,
});
export type ComplianceSpec = z.infer<typeof ComplianceSpecSchema>;

export const ReadinessSchema = z.object({
  factory_ready: z.object({
    score: z.number(), // 0-100
    dimensions: z.array(
      z.object({
        module: z.string(),
        pct: z.number(),
        weight: z.number(),
        status: z.enum(["APPLICABLE", "N_A"]),
      })
    ),
    blockers: z.array(z.string()),
  }),
  sample_ready: z.object({
    design_complete: z.boolean(),
    technically_reviewed: z.boolean(),
    sample_ready: z.boolean(),
    production_ready: z.boolean(),
    reasons: z.array(z.string()),
  }),
  stage: z.enum([
    "CONCEPT",
    "DEVELOPMENT",
    "SAMPLE",
    "FIT_VALIDATION",
    "PRE_PRODUCTION",
    "PRODUCTION",
    "QC",
    "APPROVED",
  ]),
  approval_status: z.enum([
    "AI_DRAFT",
    "IN_REVIEW",
    "TECHNICAL_REVIEW",
    "SAMPLE_APPROVAL",
    "PRODUCTION_APPROVAL",
    "APPROVED",
  ]),
});
export type Readiness = z.infer<typeof ReadinessSchema>;

export const CoreProductSpecSchema = z.object({
  schema_version: z.literal("1.0"),
  product: z.object({
    name: z.string(),
    code: z.string().nullish(),
    brand: z.string().nullish(),
    has_mvpa: z.boolean().default(false),
    description: z.string(),
    category: z.string(),
    sub_category: z.string().nullish(),
    product_family: z.string().nullish(),
    intended_use: z.string().nullish(),
    target_customer: z.string().nullish(),
    market: z.string().nullish(),
    quantity: z.number().nullish(),
    sizes: z.array(z.string()).default([]),
    target_cost: z.string().nullish(),
    target_price: z.string().nullish(),
  }),
  classification: z.object({
    confidence: UConfidenceSchema,
    activated_modules: z.array(z.string()).default([]),
    sub_category: z.string().nullish(),
    product_family: z.string().nullish(),
  }),
  components: z.array(CoreComponentSchema).default([]),
  materials: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(["fabric", "trim", "hardware", "other"]),
        composition: z.string().nullish(),
        gsm: z.number().nullish(),
        thickness_mm: z.number().nullish(),
        finish: z.string().nullish(),
        source: MVPSourceSchema,
        confidence: UConfidenceSchema,
        review_required: z.boolean(),
      })
    )
    .default([]),
  dimensions: z.array(UDimensionSchema).default([]),
  variants: z.array(UVariantSchema).default([]),
  requirements: z.array(URequirementSchema).default([]),
  assembly_sequence: z.array(AssemblyOperationSchema).default([]),
  manufacturing: z.array(ManufacturingRequirementSchema).default([]),
  function_spec: z.array(FunctionSpecSchema).default([]),
  risks: z.array(RiskSchema).default([]),
  visuals_plan: z.array(VisualAssetPlanSchema).default([]),
  packaging: z
    .array(z.object({ id: z.string(), item: z.string(), spec: z.string(), unit: z.string(), quantity: z.number() }))
    .default([]),
  compliance: z.array(ComplianceSpecSchema).default([]),
  assumptions: z.array(z.object({ id: z.string(), statement: z.string(), impact: z.string() })).default([]),
  warnings: z.array(z.object({ code: z.string(), level: z.string(), message: z.string() })).default([]),
  readiness: ReadinessSchema.nullish(),
  extensions: z.record(z.string(), z.unknown()).default({}),
  generated_at: z.string(),
});
export type CoreProductSpec = z.infer<typeof CoreProductSpecSchema>;

export const SharedProjectRecord = z.object({
  universal: CoreProductSpecSchema.nullish(),
});
