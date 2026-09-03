import { z } from "zod";
import { CoreProductSpecSchema } from "@/lib/schemas/universal";

/**
 * Canonical tech-pack schema.
 *
 * Every generated value carries provenance metadata (source / confidence /
 * requires_review) so AI inference is never presented as manufacturing truth.
 *
 * source:
 *  - "observed"       visible in the supplied image
 *  - "inferred"       strong manufacturing inference from observation
 *  - "assumed"        plausible assumption, explicitly surfaced
 *  - "user_provided"  supplied by the user in the input form
 *  - "verified"       confirmed against approved pattern / sample
 */

export const SOURCES = [
  "observed",
  "inferred",
  "assumed",
  "user_provided",
  "verified",
] as const;

export const SourceSchema = z.enum(SOURCES);
export type Source = z.infer<typeof SourceSchema>;

export const FieldValueSchema = z.object({
  value: z.string(),
  source: SourceSchema,
  confidence: z.number().min(0).max(1),
  requires_review: z.boolean().default(false),
  note: z.string().optional(),
});
export type FieldValue = z.infer<typeof FieldValueSchema>;

/* ------------------------------ Stage 1: vision analysis ------------------ */

export const ComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number().min(1),
  function: z.string(),
  source: SourceSchema,
  confidence: z.number().min(0).max(1),
});
export type Component = z.infer<typeof ComponentSchema>;

export const MaterialIndicatorSchema = z.object({
  name: z.string(),
  type: z.enum(["fabric", "trim", "hardware", "other"]),
  source: SourceSchema,
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});
export type MaterialIndicator = z.infer<typeof MaterialIndicatorSchema>;

export const AnalysisColorApproxSchema = z.object({
  name: z.string(),
  hex: z.string().optional(),
  pantone: z.string().optional(),
  dominance: z.number().optional(),
  role: z.string().optional(),
});
export type AnalysisColorApprox = z.infer<typeof AnalysisColorApproxSchema>;

export const ProductAnalysisSchema = z.object({
  product_type: z.string(),
  category: z.string(),
  silhouette: z.string(),
  reversible: z.boolean(),
  construction: z.string(),
  components: z.array(ComponentSchema).default([]),
  material_indicators: z.array(MaterialIndicatorSchema).default([]),
  seam_indicators: z.array(z.string()).default([]),
  hardware: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  label_observations: z.array(z.string()).default([]),
  colors: z.array(AnalysisColorApproxSchema).default([]),
  observable_details: z.array(z.string()).default([]),
  missing_from_image: z.array(z.string()).default([]),
  visual_notes: z.string().optional(),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    product_type: z.number().min(0).max(1),
    construction: z.number().min(0).max(1),
    materials: z.number().min(0).max(1),
  }),
});
export type ProductAnalysis = z.infer<typeof ProductAnalysisSchema>;

/* ------------------------------ Stage 2: tech pack ------------------------ */

export const SupplierInfoSchema = z.object({
  name: z.string().min(1),
  material_code: z.string().optional(),
  country: z.string().optional(),
  moq: z.string().optional(),
  lead_time_days: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().optional(),
  certification: z.string().optional(),
  contact: z.string().optional(),
  approval_status: z.enum(["APPROVED", "PENDING", "REJECTED", "UNVERIFIED"]).default("UNVERIFIED"),
});
export type SupplierInfo = z.infer<typeof SupplierInfoSchema>;

export const MaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["fabric", "trim", "hardware", "other"]),
  composition: FieldValueSchema,
  gsm: FieldValueSchema.optional(),
  width_cm: FieldValueSchema.optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  supplier: SupplierInfoSchema.optional(),
});
export type Material = z.infer<typeof MaterialSchema>;

export const BomItemSchema = z.object({
  id: z.string(),
  position: z.number().min(1),
  component_name: z.string(),
  material_name: z.string(),
  specification: z.string(),
  unit: z.string(),
  consumption: z.union([z.number(), z.string()]),
  consumption_is_estimated: z.boolean().default(true),
  color: z.string(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});
export type BomItem = z.infer<typeof BomItemSchema>;

export const MeasurementSchema = z.object({
  id: z.string(),
  name: z.string(),
  how_to_measure: z.string(),
  unit: z.string(),
  tolerance: z.string(),
  values: z.record(z.string(), z.number()),
  source: SourceSchema,
  confidence: z.number().min(0).max(1),
  requires_review: z.boolean().default(true),
});
export type Measurement = z.infer<typeof MeasurementSchema>;

export const ConstructionSectionSchema = z.object({
  section: z.string(),
  items: z.array(z.string()),
});
export type ConstructionSection = z.infer<typeof ConstructionSectionSchema>;

export const StitchSpecSchema = z.object({
  primary_stitch: z.string(),
  spi_min: z.number().optional(),
  spi_max: z.number().optional(),
  spi_text: z.string().optional(),
  seam_allowance_cm: z.number().optional(),
  seam_allowance_text: z.string().optional(),
  topstitch: z.string().optional(),
  thread: z.string().optional(),
  needle: z.string().optional(),
  source: SourceSchema,
  confidence: z.number().min(0).max(1),
  requires_review: z.boolean().default(true),
});
export type StitchSpec = z.infer<typeof StitchSpecSchema>;

export const ColorwaySchema = z.object({
  id: z.string(),
  number: z.number().min(1),
  name: z.string(),
  code: z.string().optional(),
  pantone: z.string().optional(),
  face_a: z.string(),
  face_b: z.string().optional(),
  threading: z.string().optional(),
  hardware: z.string().optional(),
  labels: z.string().optional(),
  reversible: z.boolean().default(true),
  notes: z.string().optional(),
});
export type Colorway = z.infer<typeof ColorwaySchema>;

export const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  content: z.string().optional(),
  placement: z.string().optional(),
  required: z.boolean().default(false),
  notes: z.string().optional(),
});
export type Label = z.infer<typeof LabelSchema>;

export const QcCheckSchema = z.object({
  id: z.string(),
  category: z.string(),
  check: z.string(),
  method: z.string().optional(),
  standard: z.string().optional(),
});
export type QcCheck = z.infer<typeof QcCheckSchema>;

export const PackagingItemSchema = z.object({
  id: z.string(),
  item: z.string(),
  spec: z.string(),
  unit: z.string(),
  quantity: z.union([z.number(), z.string()]),
  notes: z.string().optional(),
});
export type PackagingItem = z.infer<typeof PackagingItemSchema>;

export const AssumptionSchema = z.object({
  id: z.string(),
  statement: z.string(),
  category: z.string(),
  confidence: z.number().min(0).max(1),
  impact: z.string(),
  required_action: z.string(),
});
export type Assumption = z.infer<typeof AssumptionSchema>;

export const WarningSchema = z.object({
  code: z.string(),
  level: z.enum(["blocking", "warning", "info"]),
  message: z.string(),
  guidance: z.string().optional(),
});
export type Warning = z.infer<typeof WarningSchema>;

export const ProductInfoSchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  category: z.string(),
  product_type: z.string(),
  description: z.string().optional(),
  intended_use: z.string().optional(),
  target_customer: z.string().optional(),
  season: z.string().optional(),
  collection: z.string().optional(),
  quantity: z.number().optional(),
  brand: z.string().optional(),
  revision: z.string().default("V1.0"),
  notes: z.string().optional(),
});
export type ProductInfo = z.infer<typeof ProductInfoSchema>;

export const TechPackSchema = z.object({
  version: z.string().default("V1.0"),
  generated_at: z.string(),
  review_status: z.enum(["DRAFT", "REVIEW_REQUIRED", "APPROVED"]).default("REVIEW_REQUIRED"),
  product: ProductInfoSchema,
  materials: z.array(MaterialSchema).default([]),
  bom: z.array(BomItemSchema).default([]),
  measurements: z.array(MeasurementSchema).default([]),
  construction: z.array(ConstructionSectionSchema).default([]),
  stitching: StitchSpecSchema,
  colorways: z.array(ColorwaySchema).default([]),
  labels: z.array(LabelSchema).default([]),
  quality_control: z.array(QcCheckSchema).default([]),
  packaging: z.array(PackagingItemSchema).default([]),
  assumptions: z.array(AssumptionSchema).default([]),
  warnings: z.array(WarningSchema).default([]),
});
export type TechPack = z.infer<typeof TechPackSchema>;

/* ------------------------------ Stage 3: QA report ------------------------ */

export const QaIssueSchema = z.object({
  code: z.string(),
  level: z.enum(["blocking", "warning", "info"]),
  message: z.string(),
  field: z.string().optional(),
  guidance: z.string().optional(),
});
export type QaIssue = z.infer<typeof QaIssueSchema>;

export const QaReportSchema = z.object({
  blocking_errors: z.array(QaIssueSchema).default([]),
  warnings: z.array(QaIssueSchema).default([]),
  info: z.array(QaIssueSchema).default([]),
  checks_passed: z.number().default(0),
  checks_total: z.number().default(0),
  overall_score: z.number().min(0).max(100).default(0),
  completeness_pct: z.number().min(0).max(100).default(0),
  recommendations: z.array(z.string()).default([]),
});
export type QaReport = z.infer<typeof QaReportSchema>;

/* ----------------------------- project / inputs --------------------------- */

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  brand_name: z.string().optional(),
  image_path: z.string().optional(),
  image_back_path: z.string().optional(),
  video_path: z.string().optional(),
  category: z.string().optional(),
  intended_customer: z.string().optional(),
  target_market: z.string().optional(),
  quantity: z.number().optional(),
  sizes: z.array(z.string()),
  colorways: z.array(z.object({ name: z.string(), code: z.string().optional() })),
  notes: z.string().optional(),
  status: z.string().default("DRAFT"),
  analysis: ProductAnalysisSchema.nullable().default(null),
  tech_pack: TechPackSchema.nullable().default(null),
  qa_report: QaReportSchema.nullable().default(null),
  universal: CoreProductSpecSchema.nullable().default(null),
  version: z.string().default("V1.0"),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const RevisionSchema = z.object({
  id: z.number(),
  project_id: z.string(),
  field: z.string(),
  old_value: z.any(),
  new_value: z.any(),
  reason: z.string().optional(),
  version: z.string().optional(),
  created_at: z.string(),
});
export type Revision = z.infer<typeof RevisionSchema>;
