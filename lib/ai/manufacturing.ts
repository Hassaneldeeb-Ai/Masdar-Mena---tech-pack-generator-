import { z } from "zod";

import {
  TechPackSchema,
  type ProductAnalysis,
  type TechPack,
} from "@/lib/schemas/tech-pack";

import type { CommercialInputs } from "./pipeline-types";
import { getProvider, loadPrompt } from "./providers";
import { generateTechPackMock } from "./providers/mock-techpack";

/**
 * Universal Tech Pack Generation Pipeline
 *
 * Pipeline:
 *
 *   Product Analysis
 *        ↓
 *   Structured Tech Pack Generation
 *        ↓
 *   Schema Validation / Repair
 *        ↓
 *   Deep Manufacturing Specification
 *        ↓
 *   Integrity Validation
 *        ↓
 *   Manufacturing QA
 *
 * IMPORTANT:
 *
 * The LLM is allowed to structure and enrich information.
 * It is NOT allowed to manufacture facts.
 *
 * Evidence hierarchy:
 *
 *   observed
 *      ↓
 *   inferred
 *      ↓
 *   assumed
 *      ↓
 *   missing / review required
 *
 * Deep specification may ADD detail only when that detail is explicitly
 * marked as inferred or assumed and does not contradict existing evidence.
 */

const MAX_SCHEMA_REPAIRS = 2;
const MAX_DEEP_REPAIRS = 1;
const MAX_QA_ISSUES = 50;

const EVIDENCE_SOURCES = new Set([
  "observed",
  "inferred",
  "assumed",
]);

const MANUFACTURING_CRITICAL_TERMS = [
  "measurement",
  "dimension",
  "tolerance",
  "composition",
  "gsm",
  "material",
  "hardware",
  "seam",
  "stitch",
  "needle",
  "thread",
  "aql",
  "compliance",
  "certification",
  "country of origin",
  "barcode",
  "ean",
  "carton",
  "weight",
  "thickness",
];

type JsonObject = Record<string, unknown>;

interface ValidationResult {
  success: boolean;
  issues: string[];
}

/* -------------------------------------------------------------------------- */
/* GENERATION                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Stage 2:
 *
 * Product analysis + buyer inputs → structured technical pack.
 *
 * The first generation pass is intentionally conservative.
 * It should capture only information supported by the analysis and
 * buyer inputs.
 */
export async function generateTechPack(
  analysis: ProductAnalysis,
  inputs: CommercialInputs,
): Promise<TechPack> {
  const resolved = getProvider();

  if (resolved.kind === "mock") {
    return generateTechPackMock(analysis, inputs);
  }

  const system = await loadPrompt("manufacturing");

  const schemaJson = JSON.stringify(
    z.toJSONSchema(TechPackSchema),
    null,
    2,
  );

  const basePrompt = buildGenerationPrompt(
    analysis,
    inputs,
    schemaJson,
  );

  let raw = await resolved.provider!.jsonComplete({
    system,
    prompt: basePrompt,
  });

  raw = await repairSchema(
    raw,
    resolved.provider!,
    system,
    basePrompt,
    MAX_SCHEMA_REPAIRS,
    "initial generation",
  );

  const parsed = TechPackSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      formatSchemaFailure(
        "Generation stage",
        parsed.error,
        MAX_SCHEMA_REPAIRS,
      ),
    );
  }

  const basePack = parsed.data;

  /*
   * Deep specification is deliberately best-effort.
   *
   * A failure here must never destroy an otherwise valid base pack.
   */
  try {
    const deepened = await deepSpecify(
      basePack,
      analysis,
      inputs,
    );

    if (deepened) {
      const integrity = validateTechPackIntegrity(
        basePack,
        deepened,
      );

      if (integrity.success) {
        return TechPackSchema.parse(deepened);
      }

      /*
       * The deep pass may be schema-valid but still violate provenance
       * or identity constraints. In that case, reject the deepened pack
       * and keep the safer base result.
       */
      console.warn(
        "Deep specification rejected by integrity validation:",
        integrity.issues,
      );
    }
  } catch (error) {
    /*
     * Deep specification is an enrichment stage.
     *
     * Never fail the entire generation pipeline because enrichment failed.
     */
    console.warn(
      "Deep specification failed; returning validated base tech pack.",
      error,
    );
  }

  return basePack;
}

/* -------------------------------------------------------------------------- */
/* BASE PROMPT                                                                 */
/* -------------------------------------------------------------------------- */

function buildGenerationPrompt(
  analysis: ProductAnalysis,
  inputs: CommercialInputs,
  schemaJson: string,
): string {
  return [
    "# TASK",
    "",
    "Generate a factory-grade technical pack for the supplied physical product.",
    "",
    "The technical pack must represent the SAME product shown in the supplied",
    "product analysis. Do not redesign the product.",
    "",
    "# PRIMARY OBJECTIVE",
    "",
    "Convert the supplied evidence into structured manufacturing information.",
    "",
    "The result must be:",
    "- technically defensible",
    "- internally consistent",
    "- traceable to evidence",
    "- conservative where information is missing",
    "- suitable for downstream technical-pack generation",
    "",
    "# EVIDENCE CONTRACT",
    "",
    "Every factual field must respect the evidence hierarchy:",
    "",
    "observed",
    "→ directly visible in the supplied product image(s)",
    "",
    "inferred",
    "→ strong industry-supported inference from visible evidence",
    "",
    "assumed",
    "→ plausible but unverified information",
    "",
    "Never upgrade an inferred or assumed value to observed.",
    "",
    "Never convert an assumption into a verified manufacturing fact.",
    "",
    "# MISSING INFORMATION",
    "",
    "If information is unavailable from the analysis or buyer inputs:",
    "",
    "DO NOT INVENT IT.",
    "",
    "Use the schema's supported missing / review / nullable representation.",
    "",
    "Examples:",
    "- exact GSM",
    "- exact fibre composition",
    "- hidden construction",
    "- exact seam allowance",
    "- exact hardware grade",
    "- supplier",
    "- exact manufacturing machine",
    "- internal reinforcement",
    "- exact dimensions without scale",
    "",
    "# MEASUREMENTS",
    "",
    "Never derive physical dimensions from image proportions.",
    "",
    "Only use measurements explicitly supplied by the buyer or analysis.",
    "",
    "Never round, interpolate, estimate, or fabricate measurement values.",
    "",
    "# MATERIALS",
    "",
    "Do not infer exact material composition from appearance alone.",
    "",
    "For example, visual evidence of a plastic-like surface does not prove",
    "a specific polymer such as ABS.",
    "",
    "If composition is unknown, preserve the uncertainty.",
    "",
    "# CONSTRUCTION",
    "",
    "Only specify a manufacturing construction method when it is supported",
    "by the supplied evidence.",
    "",
    "A visible stitched seam may justify 'stitched seam'.",
    "",
    "It does not automatically justify a specific stitch class, machine,",
    "thread specification, seam allowance, or stitch density.",
    "",
    "# UNIVERSAL PRODUCT SUPPORT",
    "",
    "The product may be any physical manufactured product.",
    "",
    "Do not assume apparel terminology.",
    "",
    "Adapt the technical structure to the actual product category.",
    "",
    "# BUYER INPUTS",
    "",
    "Buyer inputs may provide authoritative commercial or technical facts.",
    "",
    "Use explicit buyer-provided facts where available.",
    "",
    "Do not allow generic industry assumptions to override explicit buyer data.",
    "",
    "# OUTPUT REQUIREMENTS",
    "",
    "Return the COMPLETE object matching the supplied schema.",
    "",
    "Return valid JSON only.",
    "",
    "Do not add fields outside the schema.",
    "",
    "# PRODUCT ANALYSIS",
    JSON.stringify(analysis, null, 2),
    "",
    "# BUYER INPUTS",
    JSON.stringify(inputs, null, 2),
    "",
    "# OUTPUT SCHEMA",
    schemaJson,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* SCHEMA REPAIR                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Repair a malformed LLM response without changing the underlying
 * manufacturing intent.
 */
async function repairSchema(
  initialRaw: unknown,
  provider: NonNullable<ReturnType<typeof getProvider>["provider"]>,
  system: string,
  basePrompt: string,
  maxRepairs: number,
  stageName: string,
): Promise<unknown> {
  let raw = initialRaw;

  for (
    let attempt = 0;
    attempt < maxRepairs;
    attempt += 1
  ) {
    const parsed = TechPackSchema.safeParse(raw);

    if (parsed.success) {
      return parsed.data;
    }

    const issues = parsed.error.issues;

    const messages = issues
      .slice(0, 15)
      .map((issue) => {
        const path = issue.path.length
          ? issue.path.join(".")
          : "<root>";

        return `${path}: ${issue.message}`;
      })
      .join("\n");

    raw = await provider.jsonComplete({
      system,
      prompt: [
        basePrompt,
        "",
        `# ${stageName.toUpperCase()} REPAIR`,
        "",
        "The previous response failed strict schema validation.",
        "",
        "Repair ONLY the structural/schema problems.",
        "",
        "Do NOT:",
        "- invent missing manufacturing facts",
        "- change valid existing values",
        "- upgrade provenance",
        "- downgrade provenance",
        "- redesign the product",
        "- remove valid information",
        "",
        "Return the COMPLETE object again.",
        "",
        "# VALIDATION ERRORS",
        messages,
      ].join("\n"),
    });
  }

  return raw;
}

/* -------------------------------------------------------------------------- */
/* DEEP SPECIFICATION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Stage 2b:
 *
 * Deepen a valid technical pack without changing its factual identity.
 *
 * The deep pass is NOT allowed to turn a sparse pack into a fictional
 * factory specification.
 */
async function deepSpecify(
  techPack: TechPack,
  analysis: ProductAnalysis,
  inputs: CommercialInputs,
): Promise<TechPack | null> {
  const resolved = getProvider();

  if (resolved.kind !== "llm") {
    return null;
  }

  const schemaJson = JSON.stringify(
    z.toJSONSchema(TechPackSchema),
    null,
    2,
  );

  const system = [
    "# ROLE",
    "",
    "You are a senior physical-product manufacturing technologist.",
    "",
    "You are performing a SECOND-PASS TECHNICAL SPECIFICATION REVIEW.",
    "",
    "# CRITICAL RULE",
    "",
    "You are enriching an EXISTING technical pack.",
    "",
    "You are NOT allowed to redesign the product.",
    "",
    "You are NOT allowed to convert uncertainty into certainty.",
    "",
    "# IMMUTABLE DATA",
    "",
    "Preserve every existing:",
    "",
    "- id",
    "- product identity",
    "- measurement value",
    "- tolerance",
    "- colour",
    "- material",
    "- component",
    "- provenance field",
    "- source",
    "- confidence",
    "- requires_review",
    "- note",
    "",
    "EXACTLY as provided.",
    "",
    "# PROVENANCE RULE",
    "",
    "Never upgrade:",
    "",
    "assumed → inferred",
    "assumed → observed",
    "inferred → observed",
    "",
    "You may only add information as inferred or assumed when the schema",
    "explicitly permits that information.",
    "",
    "# FACTUAL CONSERVATISM",
    "",
    "If a technical value is not supported:",
    "",
    "DO NOT INVENT IT.",
    "",
    "Prefer a missing value or review requirement.",
    "",
    "# SAFE DEEPENING",
    "",
    "Where appropriate, improve technical specificity by clarifying:",
    "",
    "- measurement methodology",
    "- construction descriptions",
    "- manufacturing notes",
    "- material notes",
    "- QC considerations",
    "- packaging considerations",
    "- label placement",
    "- visible component relationships",
    "",
    "Only when supported by the existing pack, analysis, or buyer inputs.",
    "",
    "# DANGEROUS FABRICATION",
    "",
    "Do NOT invent exact:",
    "",
    "- thread Tex",
    "- needle size",
    "- stitch density",
    "- seam allowance",
    "- fabric GSM",
    "- material composition",
    "- hardware grade",
    "- supplier",
    "- carton dimensions",
    "- carton weight",
    "- pallet configuration",
    "- AQL standard",
    "- legal label wording",
    "- barcode",
    "- EAN",
    "- country of origin",
    "- certification",
    "- regulatory requirement",
    "",
    "unless explicitly supported by supplied information.",
    "",
    "Generic factory practice is not evidence of this specific product.",
    "",
    "# CATEGORY ADAPTATION",
    "",
    "This system supports ANY physical product.",
    "",
    "Do not assume the product is a garment.",
    "",
    "Adapt technical terminology to the actual product category.",
    "",
    "# OUTPUT",
    "",
    "Return the COMPLETE technical pack.",
    "",
    "Valid JSON only.",
    "",
    "No commentary.",
  ].join("\n");

  const prompt = [
    "# PRODUCT ANALYSIS",
    JSON.stringify(analysis, null, 2),
    "",
    "# BUYER INPUTS",
    JSON.stringify(inputs, null, 2),
    "",
    "# EXISTING TECH PACK",
    JSON.stringify(techPack, null, 2),
    "",
    "# OUTPUT SCHEMA",
    schemaJson,
  ].join("\n");

  let raw = await resolved.provider!.jsonComplete({
    system,
    prompt,
  });

  raw = await repairDeepSpecification(
    raw,
    resolved.provider!,
    system,
    prompt,
  );

  const parsed = TechPackSchema.safeParse(raw);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

/* -------------------------------------------------------------------------- */
/* DEEP REPAIR                                                                 */
/* -------------------------------------------------------------------------- */

async function repairDeepSpecification(
  initialRaw: unknown,
  provider: NonNullable<ReturnType<typeof getProvider>["provider"]>,
  system: string,
  prompt: string,
): Promise<unknown> {
  let raw = initialRaw;

  for (
    let attempt = 0;
    attempt < MAX_DEEP_REPAIRS;
    attempt += 1
  ) {
    const parsed = TechPackSchema.safeParse(raw);

    if (parsed.success) {
      return parsed.data;
    }

    const messages = parsed.error.issues
      .slice(0, 15)
      .map((issue) => {
        const path = issue.path.length
          ? issue.path.join(".")
          : "<root>";

        return `${path}: ${issue.message}`;
      })
      .join("\n");

    raw = await provider.jsonComplete({
      system,
      prompt: [
        prompt,
        "",
        "# DEEP SPECIFICATION REPAIR",
        "",
        "Repair the schema errors below.",
        "",
        "Preserve every valid existing value and provenance field.",
        "",
        "Do not add unsupported manufacturing facts.",
        "",
        "# ERRORS",
        messages,
        "",
        "Return the COMPLETE object.",
      ].join("\n"),
    });
  }

  return raw;
}

/* -------------------------------------------------------------------------- */
/* INTEGRITY VALIDATION                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Schema validation answers:
 *
 * "Is this JSON structurally valid?"
 *
 * Integrity validation answers:
 *
 * "Did the deep model change facts or provenance?"
 *
 * Both are required for a manufacturing pipeline.
 */
function validateTechPackIntegrity(
  original: TechPack,
  candidate: TechPack,
): ValidationResult {
  const issues: string[] = [];

  const originalJson = JSON.stringify(original);
  const candidateJson = JSON.stringify(candidate);

  /*
   * The candidate is allowed to contain more information, but it must not
   * mutate immutable identity fields or existing evidence.
   */
  if (!candidateJson) {
    issues.push("Deep specification returned an empty result.");
  }

  validateImmutableIdentity(
    original,
    candidate,
    issues,
  );

  validateEvidenceProvenance(
    original,
    candidate,
    issues,
  );

  validateCriticalValues(
    original,
    candidate,
    issues,
  );

  /*
   * This check intentionally does NOT reject all differences.
   * Deep specification is supposed to enrich the pack.
   */
  if (
    originalJson === candidateJson &&
    issues.length === 0
  ) {
    return {
      success: true,
      issues: [],
    };
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

/* -------------------------------------------------------------------------- */
/* IMMUTABLE IDENTITY                                                          */
/* -------------------------------------------------------------------------- */

function validateImmutableIdentity(
  original: TechPack,
  candidate: TechPack,
  issues: string[],
): void {
  if (
    original.product.name !== candidate.product.name
  ) {
    issues.push(
      "Deep specification changed product.name.",
    );
  }

  if (
    original.product.category !== candidate.product.category
  ) {
    issues.push(
      "Deep specification changed product.category.",
    );
  }

  if (
    original.product.product_type !==
    candidate.product.product_type
  ) {
    issues.push(
      "Deep specification changed product.product_type.",
    );
  }

  validateArrayIds(
    "measurements",
    original.measurements,
    candidate.measurements,
    issues,
  );

  validateArrayIds(
    "materials",
    original.materials,
    candidate.materials,
    issues,
  );
}

/* -------------------------------------------------------------------------- */
/* ARRAY ID VALIDATION                                                         */
/* -------------------------------------------------------------------------- */

function validateArrayIds(
  field: string,
  original: Array<{ id?: unknown }>,
  candidate: Array<{ id?: unknown }>,
  issues: string[],
): void {
  const originalIds = original
    .map((item) => String(item.id ?? ""))
    .filter(Boolean);

  const candidateIds = candidate
    .map((item) => String(item.id ?? ""))
    .filter(Boolean);

  for (const id of originalIds) {
    if (!candidateIds.includes(id)) {
      issues.push(
        `Deep specification removed ${field} id "${id}".`,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* PROVENANCE VALIDATION                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Traverse both objects and ensure existing provenance is not silently
 * upgraded or rewritten.
 *
 * This intentionally uses a generic recursive walker because provenance
 * can live at different levels of the TechPack schema.
 */
function validateEvidenceProvenance(
  original: unknown,
  candidate: unknown,
  issues: string[],
  path: string[] = [],
): void {
  if (
    !original ||
    !candidate ||
    typeof original !== "object" ||
    typeof candidate !== "object"
  ) {
    return;
  }

  if (
    Array.isArray(original) ||
    Array.isArray(candidate)
  ) {
    return;
  }

  const originalRecord =
    original as Record<string, unknown>;

  const candidateRecord =
    candidate as Record<string, unknown>;

  if ("source" in originalRecord) {
    const originalSource =
      String(originalRecord.source ?? "");

    const candidateSource =
      String(candidateRecord.source ?? "");

    if (
      originalSource &&
      candidateSource !== originalSource
    ) {
      issues.push(
        `Provenance changed at ${formatPath(path.concat("source"))}: ` +
        `"${originalSource}" → "${candidateSource}".`,
      );
    }

    if (
      originalSource &&
      !EVIDENCE_SOURCES.has(originalSource)
    ) {
      issues.push(
        `Invalid original evidence source at ${formatPath(
          path.concat("source"),
        )}: "${originalSource}".`,
      );
    }
  }

  if ("confidence" in originalRecord) {
    const originalConfidence =
      originalRecord.confidence;

    const candidateConfidence =
      candidateRecord.confidence;

    if (
      typeof originalConfidence === "number" &&
      typeof candidateConfidence === "number" &&
      candidateConfidence !== originalConfidence
    ) {
      issues.push(
        `Confidence changed at ${formatPath(
          path.concat("confidence"),
        )}.`,
      );
    }
  }

  if ("requires_review" in originalRecord) {
    const originalReview =
      originalRecord.requires_review;

    const candidateReview =
      candidateRecord.requires_review;

    if (
      originalReview !== undefined &&
      candidateReview !== originalReview
    ) {
      issues.push(
        `Review state changed at ${formatPath(
          path.concat("requires_review"),
        )}.`,
      );
    }
  }

  for (const key of Object.keys(originalRecord)) {
    if (!(key in candidateRecord)) {
      continue;
    }

    validateEvidenceProvenance(
      originalRecord[key],
      candidateRecord[key],
      issues,
      path.concat(key),
    );
  }
}

/* -------------------------------------------------------------------------- */
/* CRITICAL VALUE VALIDATION                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Prevent the deep model from changing existing manufacturing-critical
 * values while still allowing it to add genuinely new information.
 */
function validateCriticalValues(
  original: unknown,
  candidate: unknown,
  issues: string[],
  path: string[] = [],
): void {
  if (
    !original ||
    !candidate ||
    typeof original !== "object" ||
    typeof candidate !== "object"
  ) {
    return;
  }

  if (
    Array.isArray(original) ||
    Array.isArray(candidate)
  ) {
    /*
     * Array identity is checked separately.
     *
     * We still compare matching object entries by index as a conservative
     * fallback for schemas that do not expose IDs.
     */
    if (
      Array.isArray(original) &&
      Array.isArray(candidate)
    ) {
      const length = Math.min(
        original.length,
        candidate.length,
      );

      for (let i = 0; i < length; i += 1) {
        validateCriticalValues(
          original[i],
          candidate[i],
          issues,
          path.concat(String(i)),
        );
      }
    }

    return;
  }

  const originalRecord =
    original as Record<string, unknown>;

  const candidateRecord =
    candidate as Record<string, unknown>;

  for (const key of Object.keys(originalRecord)) {
    if (!(key in candidateRecord)) {
      continue;
    }

    const nextPath = path.concat(key);

    if (
      isCriticalField(
        key,
        nextPath,
      )
    ) {
      const originalValue =
        originalRecord[key];

      const candidateValue =
        candidateRecord[key];

      if (
        originalValue !== null &&
        originalValue !== undefined &&
        candidateValue !== originalValue
      ) {
        /*
         * Avoid false positives for nested objects by comparing their
         * serialized representation.
         */
        if (
          typeof originalValue === "object" &&
          typeof candidateValue === "object"
        ) {
          if (
            JSON.stringify(originalValue) !==
            JSON.stringify(candidateValue)
          ) {
            issues.push(
              `Critical value changed at ${formatPath(nextPath)}.`,
            );
          }
        } else {
          issues.push(
            `Critical value changed at ${formatPath(nextPath)}.`,
          );
        }
      }
    }

    validateCriticalValues(
      originalRecord[key],
      candidateRecord[key],
      issues,
      nextPath,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* FIELD CLASSIFICATION                                                        */
/* -------------------------------------------------------------------------- */

function isCriticalField(
  key: string,
  path: string[],
): boolean {
  const normalizedKey = key.toLowerCase();

  if (
    [
      "id",
      "source",
      "confidence",
      "requires_review",
      "note",
    ].includes(normalizedKey)
  ) {
    return true;
  }

  if (
    MANUFACTURING_CRITICAL_TERMS.some(
      (term) =>
        normalizedKey.includes(term),
    )
  ) {
    return true;
  }

  return path.some((segment) =>
    MANUFACTURING_CRITICAL_TERMS.some(
      (term) =>
        segment.toLowerCase().includes(term),
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* QA REVIEW                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Stage 3:
 *
 * Independent manufacturing QA review.
 *
 * QA does not mutate the tech pack.
 * It produces actionable findings.
 */
export async function qaReview(
  techPack: TechPack,
  inputs: CommercialInputs,
): Promise<{
  recommendations: string[];
  issues: Array<{
    code: string;
    level: "blocking" | "warning" | "info";
    message: string;
    field?: string;
    guidance?: string;
  }>;
} | null> {
  const resolved = getProvider();

  if (resolved.kind !== "llm") {
    return null;
  }

  const system = await loadPrompt("qa");

  const prompt = [
    "# ROLE",
    "",
    "You are an independent senior manufacturing QA reviewer.",
    "",
    "Review the technical pack as if it will be sent to a real factory.",
    "",
    "# REVIEW OBJECTIVE",
    "",
    "Identify information that could cause:",
    "",
    "- manufacturing ambiguity",
    "- incorrect production",
    "- incorrect material sourcing",
    "- incorrect measurement",
    "- incorrect construction",
    "- compliance risk",
    "- QC ambiguity",
    "- packaging ambiguity",
    "- buyer expectation mismatch",
    "",
    "# IMPORTANT",
    "",
    "Do not invent replacement values.",
    "",
    "Do not silently rewrite the technical pack.",
    "",
    "If something is unknown, identify it as missing.",
    "",
    "If something is an assumption, identify it as an assumption.",
    "",
    "If something is technically risky, explain why.",
    "",
    "# SEVERITY",
    "",
    "blocking:",
    "A missing or contradictory fact could reasonably prevent safe or correct production.",
    "",
    "warning:",
    "The pack can progress, but clarification or refinement is recommended.",
    "",
    "info:",
    "Useful improvement that does not currently block production.",
    "",
    "# OUTPUT",
    "",
    "Return JSON only.",
    "",
    "Return:",
    "{",
    '  "recommendations": string[],',
    '  "blocking_errors": object[],',
    '  "warnings": object[],',
    '  "info": object[]',
    "}",
    "",
    "# TECH PACK",
    JSON.stringify(techPack, null, 2),
    "",
    "# BUYER INPUTS",
    JSON.stringify(inputs, null, 2),
  ].join("\n");

  const raw =
    await resolved.provider!.jsonComplete({
      system,
      prompt,
    });

  return normalizeQaResult(raw);
}

/* -------------------------------------------------------------------------- */
/* QA NORMALIZATION                                                            */
/* -------------------------------------------------------------------------- */

function normalizeQaResult(
  raw: unknown,
): {
  recommendations: string[];
  issues: Array<{
    code: string;
    level: "blocking" | "warning" | "info";
    message: string;
    field?: string;
    guidance?: string;
  }>;
} | null {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw)
  ) {
    return null;
  }

  const result = raw as JsonObject;

  const recommendations =
    normalizeStringArray(
      result.recommendations,
    );

  const issues: Array<{
    code: string;
    level: "blocking" | "warning" | "info";
    message: string;
    field?: string;
    guidance?: string;
  }> = [];

  appendQaIssues(
    issues,
    result.blocking_errors,
    "blocking",
  );

  appendQaIssues(
    issues,
    result.warnings,
    "warning",
  );

  appendQaIssues(
    issues,
    result.info,
    "info",
  );

  return {
    recommendations,
    issues: issues.slice(0, MAX_QA_ISSUES),
  };
}

function appendQaIssues(
  target: Array<{
    code: string;
    level: "blocking" | "warning" | "info";
    message: string;
    field?: string;
    guidance?: string;
  }>,
  rawIssues: unknown,
  level: "blocking" | "warning" | "info",
): void {
  if (!Array.isArray(rawIssues)) {
    return;
  }

  for (const rawIssue of rawIssues) {
    if (
      !rawIssue ||
      typeof rawIssue !== "object" ||
      Array.isArray(rawIssue)
    ) {
      continue;
    }

    const issue =
      rawIssue as Record<string, unknown>;

    const message =
      typeof issue.message === "string"
        ? issue.message.trim()
        : "";

    if (!message) {
      continue;
    }

    target.push({
      code:
        typeof issue.code === "string" &&
          issue.code.trim()
          ? issue.code.trim()
          : "ai_qa",
      level,
      message,
      field:
        typeof issue.field === "string" &&
          issue.field.trim()
          ? issue.field.trim()
          : undefined,
      guidance:
        typeof issue.guidance === "string" &&
          issue.guidance.trim()
          ? issue.guidance.trim()
          : undefined,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

function normalizeStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPath(
  path: string[],
): string {
  return path.length
    ? path.join(".")
    : "<root>";
}

function formatSchemaFailure(
  stage: string,
  error: z.ZodError,
  attempts: number,
): string {
  const issues = error.issues
    .slice(0, 8)
    .map((issue) => {
      const path = issue.path.length
        ? issue.path.join(".")
        : "<root>";

      return `${path}: ${issue.message}`;
    })
    .join("; ");

  return (
    `${stage} returned invalid data after ` +
    `${attempts} repair attempt(s): ${issues}`
  );
}
