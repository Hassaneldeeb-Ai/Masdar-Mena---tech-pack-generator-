import type { CoreProductSpec, UDimension, UVariant, URequirement, AssemblyOperation, URisks, UFieldValue } from "@/lib/schemas/universal";
import { toUFieldSource, uf } from "@/lib/schemas/universal";
import type { TechPack, ProductAnalysis, QaReport } from "@/lib/schemas/tech-pack";

type LegacySource = "observed" | "inferred" | "assumed" | "user_provided" | "verified" | "document_extracted" | "reference_standard" | "manually_edited" | "unknown";

const dimTypeOf = (name: string): UDimension["type"] => {
  const n = name.toLowerCase();
  if (/head|circum|girth/.test(n)) return "CIRCUMFERENCE";
  if (/height|length|deep/.test(n)) return "HEIGHT";
  if (/width|diameter/.test(n)) return "WIDTH";
  if (/depth/.test(n)) return "DEPTH";
  if (/volume|capacity/.test(n)) return "VOLUME";
  return "OTHER";
};

const parseTol = (t: string): number | undefined => {
  const m = t.match(/[+-]?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};

const srcOf = (s: string): LegacySource => (s as LegacySource) ?? "unknown";
const confOf = (c: number): "HIGH" | "MEDIUM" | "LOW" => c >= 0.8 ? "HIGH" : c >= 0.55 ? "MEDIUM" : "LOW";

const TYPE_OF_ANALYSIS_COMPONENT: Record<string, string> = {
  crown: "STRUCTURAL",
  brim: "STRUCTURAL",
  panel: "STRUCTURAL",
  lining: "LINING",
  body: "BODY",
  handle: "HANDLE",
  frame: "FRAME",
  shell: "ENCLOSURE",
};

function componentType(name: string): string {
  for (const k of Object.keys(TYPE_OF_ANALYSIS_COMPONENT)) if (name.toLowerCase().includes(k)) return TYPE_OF_ANALYSIS_COMPONENT[k];
  return "PART";
}

export function mapToUniversal(args: {
  pack: TechPack;
  analysis: ProductAnalysis | null;
  project: { name: string; description: string; brand_name?: string | null; quantity?: number | null; sizes: string[]; colorways: { name: string; code?: string }[]; image_back_path?: string | null };
  qaReport: QaReport | null;
}): CoreProductSpec {
  const { pack, analysis, project, qaReport } = args;
  const analysisSrc = "inferred" as LegacySource;
  const qaWarnings = qaReport?.warnings ?? [];

  /* ---------- components ---------- */
  const components = (analysis?.components ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    type: componentType(c.name),
    parent_id: null as string | null,
    function: c.function ?? null,
    material_ref: null as string | null,
    relationship: null,
    position: null,
    source: srcOf(c.source),
    confidence: confOf(c.confidence ?? 0.8),
    status: "REQUIRES_CONFIRMATION" as const,
    review_required: true,
  }));
  if (components.length === 0) {
    components.push({
      id: "comp-main",
      name: "Main body",
      type: "BODY",
      parent_id: null,
      function: "Primary component of the product",
      material_ref: null,
      relationship: null,
      position: null,
      source: analysisSrc,
      confidence: "MEDIUM",
      status: "REQUIRES_CONFIRMATION",
      review_required: true,
    });
  }
  for (const m of pack.materials) {
    const idx = components.findIndex((cp) => cp.name.toLowerCase().includes(m.name.split(" ")[0].toLowerCase()));
    if (idx >= 0) components[idx].material_ref = m.id;
  }

  /* ---------- materials ---------- */
  const materials = pack.materials.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    composition: m.composition ? String(m.composition.value) : null,
    gsm: m.gsm ? Number(m.gsm.value) : null,
    thickness_mm: null,
    finish: null,
    source: srcOf(m.composition?.source ?? "inferred"),
    confidence: confOf(m.composition?.confidence ?? 0.6),
    review_required: m.composition?.requires_review ?? false,
  }));

  /* ---------- dimensions (per size + grading) ---------- */
  const sizes = project.sizes ?? [];
  const dimensions: UDimension[] = pack.measurements.map((m, i) => {
    const vals = sizes.filter((s) => typeof m.values[s] === "number").map((s) => m.values[s]);
    const min = vals.length ? Math.min(...(vals as number[])) : undefined;
    const max = vals.length ? Math.max(...(vals as number[])) : undefined;
    const tol = parseTol(m.tolerance);
    const span = min !== undefined && max !== undefined && vals.length > 1 ? Number((max - min).toFixed(2)) : undefined;
    const step = span !== undefined ? Number((span / Math.max(1, vals.length - 1)).toFixed(2)) : undefined;
    return {
      id: m.id,
      name: m.name,
      type: dimTypeOf(m.name),
      unit: m.unit,
      value: { nominal: vals[0] ?? Object.values(m.values)[0] ?? 0, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}), ...(tol !== undefined ? { tolerance: tol } : {}) },
      ...(Object.keys(m.values).length > 0 ? { per_size: m.values as Record<string, number> } : {}),
      ...(span !== undefined ? { grading: { base_size: sizes[0] ?? null, step, span } } : {}),
      method: m.how_to_measure ?? null,
      reference_component: components.length ? components[0].id : null,
      source: srcOf(m.source ?? "inferred"),
      confidence: confOf(m.confidence ?? 0.6),
      status: (m.requires_review ? "REQUIRES_CONFIRMATION" : "CONFIRMED") as UDimension["status"],
      review_required: m.requires_review ?? true,
      ...(m.id === `pom-${i}` ? {} : {}),
    };
  });

  /* ---------- variants ---------- */
  const variants: UVariant[] = (pack.colorways ?? []).map((c, i) => ({
    id: `var-color-${i + 1}`,
    name: c.name,
    variant_type: "COLOR",
    attributes: [
      ...(c.code ? [{ name: "hex", value: c.code }] : []),
      ...(c.pantone ? [{ name: "pantone", value: c.pantone }] : []),
    ],
    specification_differences: c.face_b ? ["Reversible — second face uses the paired colourway."] : [],
    visual_asset_ref: null,
    source: analysisSrc,
    confidence: "MEDIUM",
    status: "REQUIRES_CONFIRMATION",
    review_required: true,
  }));
  if (sizes.length > 0) {
    variants.push({
      id: "var-size",
      name: "Size grading",
      variant_type: "SIZE",
      attributes: sizes.map((s) => ({ name: "size", value: s })),
      specification_differences: dimensions.filter((d) => d.grading).map((d) => `${d.name}: ±${(d.grading!.span ?? 0) / 2} cm about ${d.grading!.base_size ?? "base"} (span ${d.grading?.span} cm)`),
      visual_asset_ref: "size_chart",
      source: "user_provided" as LegacySource,
      confidence: "HIGH",
      status: "CONFIRMED",
      review_required: false,
    });
  }

  /* ---------- requirements (from QA + core completeness) ---------- */
  const requirements: URequirement[] = [];
  const push = (r: URequirement) => requirements.push(r);
  const qcMap = (qaReport?.blocking_errors.length ?? 0) + qaWarnings.length;

  if (pack.product.name) push({ id: "REQ-001", category: "PRODUCT", statement: "Product name and identity defined and approved by the buyer.", target: pack.product.name, priority: "P1", status: "PASS", verification_method: "Review of product record", source: "user_provided" as LegacySource, traceability: { component_ids: [], dimension_ids: [], qc_ids: [] } });
  if (materials.length > 0) push({ id: "REQ-002", category: "MATERIAL", statement: "All materials identified with composition and weight.", target: `${materials.filter((m) => m.composition).length}/${materials.length} materials with composition`, priority: "P1", status: materials.every((m) => m.composition) ? "PASS" : "REVIEW", verification_method: "Supplier material datasheet", source: analysisSrc, traceability: { component_ids: [], dimension_ids: [], qc_ids: [] } });
  if (dimensions.length > 0) push({ id: "REQ-003", category: "DIMENSION", statement: "Every dimension carries a value, tolerance and covers all declared sizes.", target: `${dimensions.length} dimensions`, priority: "P1", status: qaWarnings.some((w) => w.code === "measurements_require_approval") ? "REVIEW" : "PASS", verification_method: "POM inspection on sample", source: analysisSrc, traceability: { qc_ids: [], component_ids: [], dimension_ids: dimensions.slice(0, 6).map((d) => d.id) } });
  if (pack.stitching.primary_stitch) push({ id: "REQ-004", category: "MANUFACTURING", statement: "Assembly method defined (stitch, SPI, seam allowance).", target: `${pack.stitching.primary_stitch} — ${pack.stitching.spi_text ?? ""}`, priority: "P1", status: "PASS", verification_method: "Line trial", source: analysisSrc, traceability: { component_ids: [], dimension_ids: [], qc_ids: [] } });
  if (pack.quality_control.length > 0) push({ id: "REQ-005", category: "QUALITY", statement: "QC checkpoints cover dimensions, materials, assembly, finish and packaging.", target: `${pack.quality_control.length} checkpoints`, priority: "P1", status: "PASS", verification_method: "Inspection plan", source: analysisSrc, traceability: { component_ids: [], dimension_ids: [], qc_ids: pack.quality_control.slice(0, 8).map((q) => q.id) } });
  if (pack.packaging.length > 0) push({ id: "REQ-006", category: "PACKAGING", statement: "Packaging requirement specified (item, spec, unit, quantity).", target: `${pack.packaging.length} packing items`, priority: "P2", status: "PASS", verification_method: "Packing list", source: analysisSrc, traceability: { component_ids: [], dimension_ids: [], qc_ids: [] } });
  if (sizes.length > 0) push({ id: "REQ-007", category: "DIMENSION", statement: "Size range and grading approved.", target: sizes.join(", "), priority: "P2", status: "PASS", verification_method: "Grading plan review", source: "user_provided" as LegacySource, traceability: { component_ids: [], dimension_ids: [], qc_ids: [] } });
  if (pack.labels.some((l) => /care/i.test(l.name))) push({ id: "REQ-008", category: "COMPLIANCE", statement: "Care labelling content and placement comply with the target market regulation.", target: pack.labels.find((l) => /care/i.test(l.name))?.content ?? null, priority: "P1", status: "REVIEW", verification_method: "Care-label standard check", source: analysisSrc, traceability: { component_ids: [], dimension_ids: [], qc_ids: [] } });
  for (const w of qaWarnings.slice(0, 3)) {
    const cat = w.code.startsWith("fabric") ? "MATERIAL" : w.code.startsWith("measurement") ? "DIMENSION" : w.code.startsWith("label") ? "BRAND" : "QUALITY";
    push({ id: `REQ-${String(requirements.length + 1).padStart(3, "0")}`, category: cat as URequirement["category"], statement: w.message, priority: "P2", status: "WARNING", verification_method: "Resolve during technical review", source: analysisSrc, traceability: { component_ids: [], dimension_ids: [], qc_ids: [] } });
  }
  if (qcMap === 0 && pack.assumptions.length > 0) void 0;

  /* ---------- assembly sequence ---------- */
  const assembly_sequence: AssemblyOperation[] = [];
  let stepN = 1;
  const opOf = (text: string): AssemblyOperation["operation"] => {
    const t = text.toLowerCase();
    if (/\bcut\b/.test(t)) return "CUT";
    if (/\bsew|stitch/.test(t)) return "SEW";
    if (/\bfold/.test(t)) return "FOLD";
    if (/\btrim/.test(t)) return "FINISH";
    if (/\bpress|iron/.test(t)) return "PRESS";
    if (/\battach/.test(t)) return "FASTEN";
    return "ASSEMBLE";
  };
  for (const sec of pack.construction) {
    for (const item of sec.items) {
      assembly_sequence.push({
        id: `op-${String(stepN).padStart(2, "0")}`,
        step: stepN++,
        operation: opOf(item),
        description: item,
        components: components.length ? [components[0].id] : [],
        tools: [],
        machine: item.toLowerCase().includes("sew") ? pack.stitching.primary_stitch ?? null : null,
        parameters: pack.stitching.spi_text ?? null,
        critical_instruction: null,
        qc_checkpoint: null,
        duration_min: item.toLowerCase().includes("sew") ? 1.2 : null,
        section: sec.section,
      });
    }
  }

  /* ---------- manufacturing ---------- */
  const manufacturing = [
    {
      id: "man-01",
      process: "Cutting",
      machine: null as string | null,
      tool: null as string | null,
      parameter: null as string | null,
      tolerance: null as string | null,
      sequence: 1,
      operator_instruction: "Cut with the approved pattern, direction and grain compliance.",
      inspection: null as string | null,
      safety: null as string | null,
    },
    {
      id: "man-02",
      process: "Sewing",
      machine: pack.stitching.primary_stitch ?? null,
      tool: "75/11 needle",
      parameter: `${pack.stitching.spi_text ?? ""} · ${pack.stitching.seam_allowance_text ?? ""}`,
      tolerance: null,
      sequence: 2,
      operator_instruction: pack.stitching.topstitch ?? null,
      inspection: "In-line: seam straightness, SPI and allowance consistency.",
      safety: null,
    },
    ...(pack.quality_control.slice(0, 4).map((q, i) => ({
      id: `man-${String(i + 3).padStart(2, "0")}`,
      process: "Inspection",
      machine: null,
      tool: null,
      parameter: q.method ?? null,
      tolerance: q.standard ?? null,
      sequence: 3 + i,
      operator_instruction: q.check,
      inspection: "Final inspection per QC plan.",
      safety: null,
    }))),
  ];

  /* ---------- function spec ---------- */
  const function_spec: CoreProductSpec["function_spec"] = pack.product.intended_use
    ? [{ id: "func-01", name: "Intended use", target: pack.product.intended_use, input: null, output: null, limit: null, test_method: null, acceptance_criteria: null, status: "SPECIFIED", source: analysisSrc }]
    : [];

  /* ---------- risks ---------- */
  const risks: URisks[] = [];
  const pushRisk = (r: URisks) => risks.push(r);
  for (const w of qaWarnings.slice(0, 4)) {
    const severity = w.code === "fabric_composition_not_verified" || w.code === "measurements_require_approval" ? "HIGH" : w.code === "fabric_gsm_missing" ? "MEDIUM" : "LOW";
    pushRisk({
      id: `risk-${risks.length + 1}`,
      description: w.message,
      cause: "Information not confirmed in source data.",
      probability: "MEDIUM",
      impact: severity,
      severity,
      mitigation: w.guidance ?? "Confirm during technical review.",
      status: "OPEN",
      source: analysisSrc,
    });
  }
  if (risks.length === 0) pushRisk({ id: "risk-1", description: "No known risks flagged by QA.", cause: null, probability: "LOW", impact: "LOW", severity: "LOW", mitigation: null, status: "CLOSED", source: analysisSrc });

  /* ---------- visual asset plan (all AI-generated, grounded in pack data) ---------- */
  const va = (id: string, type: string, purpose: string, entities: string[], note?: string) => ({
    id,
    type,
    purpose,
    generation: "GENERATIVE" as const,
    status: "PLANNED" as const,
    associated_entities: entities,
    ...(note ? { note } : {}),
  });
  const visuals_plan = [
    va("va-hero", "HERO", "Clean product hero render from the reference image", [], "Reference image is ground truth."),
    va("va-front", "TECHNICAL_DRAWING", "AI technical flat — front view", components.map((c) => c.id), "Front flat sketch"),
    va("va-back", "TECHNICAL_DRAWING", "AI technical flat — back view", components.map((c) => c.id), "Back flat sketch"),
    va("va-construction", "CONSTRUCTION_GUIDE", "Numbered assembly callouts", assembly_sequence.map((o) => o.id)),
    va("va-pom", "DIMENSION_DIAGRAM", "POM breakpoints on the product", dimensions.map((d) => d.id)),
    va("va-sizechart", "VARIANTS", "Size grading progression", ["var-size"]),
    va("va-care", "COMPLIANCE_DIAGRAM", "Care symbol strip", ["REQ-008"]),
    ...(materials.length ? [va("va-materials", "MATERIAL_BOARD", "Material swatch board", materials.map((m) => m.id))] : []),
  ];

  /* ---------- packaging / compliance / assumptions ---------- */
  const packaging = pack.packaging.map((p) => ({ id: p.id, item: p.item, spec: p.spec, unit: p.unit, quantity: p.quantity }));
  const compliance = pack.labels.some((l) => /care/i.test(l.name))
    ? [{ id: "comp-01", requirement: "Care labelling content and placement per target market.", standard: undefined as string | undefined, region: undefined, status: "UNVERIFIED" as const, source: analysisSrc }]
    : [];
  const assumptions = pack.assumptions.map((a) => ({ id: a.id, statement: a.statement, impact: a.impact ?? "Medium" }));
  const warningsMapper = (pack.warnings ?? []).map((w) => ({ code: w.code, level: w.level, message: w.message }));

  return {
    schema_version: "1.0",
    product: {
      name: project.name || pack.product.name,
      code: pack.product.code ?? null,
      brand: (project.brand_name ?? pack.product.brand) ?? null,
      has_mvpa: false,
      description: project.description ?? pack.product.description ?? "",
      category: pack.product.category ?? "Other",
      sub_category: analysis?.product_type ?? null,
      product_family: analysis?.category ?? null,
      intended_use: pack.product.intended_use ?? null,
      target_customer: pack.product.target_customer ?? null,
      market: null,
      quantity: project.quantity ?? null,
      sizes,
      target_cost: null,
      target_price: null,
    },
    classification: {
      confidence: analysis?.confidence?.overall && analysis.confidence.overall >= 0.8 ? ("HIGH" as const) : ("MEDIUM" as const),
      sub_category: analysis?.product_type ?? null,
      product_family: analysis?.category ?? null,
      activated_modules: dedupe([
        "PRODUCT", "COMPONENTS",
        ...(materials.length ? ["MATERIALS"] : []),
        ...(dimensions.length ? ["DIMENSIONS"] : []),
        ...(variants.length ? ["VARIANTS"] : []),
        ...(assembly_sequence.length ? ["ASSEMBLY"] : []),
        ...(manufacturing.length ? ["MANUFACTURING"] : []),
        ...(function_spec.length ? ["PERFORMANCE"] : []),
        ...(pack.quality_control.length ? ["QUALITY"] : []),
        ...(pack.packaging.length ? ["PACKAGING"] : []),
        ...(compliance.length ? ["COMPLIANCE"] : []),
      ]),
    },
    components,
    materials,
    dimensions,
    variants,
    requirements,
    assembly_sequence,
    manufacturing,
    function_spec,
    risks,
    visuals_plan,
    packaging,
    compliance,
    assumptions,
    warnings: warningsMapper,
    readiness: null,
    extensions: { qc_count: pack.quality_control.length },
    generated_at: new Date().toISOString(),
  } as CoreProductSpec;
}

function dedupe(a: string[]): string[] { return [...new Set(a)].filter(Boolean); }

/** Serialize an MVP FieldValue into a universal UFieldValue for export. */
export function fvToU(f: { value: unknown; source?: string; confidence?: number; requires_review?: boolean; note?: string }): UFieldValue {
  return uf((f.value as UFieldValue["value"]) ?? null, {
    source: toUFieldSource(f.source ?? "unknown"),
    confidence: (f.confidence ?? 0.5) >= 0.8 ? "HIGH" : (f.confidence ?? 0.5) >= 0.55 ? "MEDIUM" : "LOW",
    review_required: f.requires_review,
    note: f.note,
  });
}
