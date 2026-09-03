import { readFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProduct, type ImageInput } from "./vision";
import { generateTechPack, qaReview } from "./manufacturing";
import { getProvider } from "./providers";
import { runQaChecks } from "@/lib/quality/engine";
import { saveGeneration, saveTechPack, saveUniversal, bumpVersion, getProject } from "@/lib/db";
import type { QaIssue, QaReport, TechPack } from "@/lib/schemas/tech-pack";
import type { CommercialInputs } from "./pipeline-types";
import { mapToUniversal } from "@/lib/universal/mapper";
import { computeReadiness } from "@/lib/universal/readiness";
import { queueVisualGeneration } from "@/lib/ai/image";

function syncUniversal(projectId: string) {
  const project = getProject(projectId);
  if (!project?.tech_pack) return;
  const spec = mapToUniversal({
    pack: project.tech_pack,
    analysis: project.analysis ?? null,
    project: {
      name: project.name,
      description: project.description,
      brand_name: project.brand_name,
      quantity: project.quantity,
      sizes: project.sizes,
      colorways: project.colorways,
      image_back_path: project.image_back_path,
    },
    qaReport: project.qa_report ?? null,
  });
  spec.readiness = computeReadiness(spec);
  saveUniversal(projectId, spec);
}

export interface GenerationResult {
  techPack: TechPack;
  qaReport: QaReport;
  provider: string;
}

function mergeQa(report: QaReport, aiIssues: QaIssue[] | null): QaReport {
  if (!aiIssues?.length) return report;
  const existing = new Set(
    [...report.blocking_errors, ...report.warnings, ...report.info].map((i) => i.code)
  );
  const push = (list: QaIssue[], issue: QaIssue) => {
    if (!existing.has(issue.code)) {
      list.push(issue);
      existing.add(issue.code);
    }
  };
  const blocking = [...report.blocking_errors];
  const warnings = [...report.warnings];
  const info = [...report.info];
  for (const i of aiIssues) {
    if (i.level === "blocking") push(blocking, i);
    else if (i.level === "warning") push(warnings, i);
    else push(info, i);
  }
  return {
    blocking_errors: blocking,
    warnings,
    info,
    checks_passed: report.checks_passed,
    checks_total: report.checks_total,
    overall_score: Math.max(0, report.overall_score - blocking.length * 10),
    completeness_pct: report.completeness_pct,
    recommendations: report.recommendations,
  };
}

/** Full pipeline: analysis -> tech pack -> QA. */
export async function runPipeline(
  inputs: CommercialInputs,
  image?: ImageInput,
  projectId?: string,
  imageBack?: ImageInput
): Promise<GenerationResult> {
  const analysis = await analyzeProduct(inputs, image, imageBack);
  const techPack = await generateTechPack(analysis, inputs);

  const sizesRule = inputs.sizes.length > 0 ? inputs.sizes : ["S", "M", "L"];
  const qaReport = runQaChecks({
    techPack,
    sizes: sizesRule,
    quantity: inputs.quantity,
  });
  const aiIssues = await qaReview(techPack, inputs).catch(() => null);
  const finalReport = mergeQa(qaReport, aiIssues?.issues ?? null);
  finalReport.recommendations = [
    ...finalReport.recommendations,
    ...(aiIssues?.recommendations ?? []).map((r: unknown) =>
      typeof r === "string" ? r : (r as { message?: string }).message ?? JSON.stringify(r)
    ),
  ].slice(0, 8);

  techPack.warnings = finalReport.warnings.map((w) => ({
    code: w.code,
    level: w.level,
    message: w.message,
    guidance: w.guidance,
  }));

  if (projectId) {
    saveGeneration(projectId, { analysis, tech_pack: techPack, qa_report: finalReport });
    syncUniversal(projectId);
    // Fire-and-forget: generate every AI visual asset in the background.
    queueVisualGeneration(projectId);
  }
  return { techPack, qaReport: finalReport, provider: getProvider().name };
}

/** Re-run QA against the (possibly edited) stored tech pack. */
export function requalifyTechPack(projectId: string, techPack: TechPack, sizes: string[], quantity?: number): QaReport {
  const qaReport = runQaChecks({ techPack, sizes, quantity });
  techPack.warnings = qaReport.warnings.map((w) => ({
    code: w.code,
    level: w.level,
    message: w.message,
    guidance: w.guidance,
  }));
  saveTechPack(projectId, techPack, qaReport);
  syncUniversal(projectId);
  return qaReport;
}

export function nextVersion(techPack: TechPack): TechPack {
  return { ...techPack, version: bumpVersion(techPack.version) };
}

/** Read an uploaded image into a base64 payload for the vision stage. */
export async function readImageInput(uploadsDir: string, filePath: string): Promise<ImageInput | undefined> {
  const full = path.join(uploadsDir, filePath);
  const data = await readFile(full).catch(() => null);
  if (!data) return undefined;
  const mime = full.endsWith(".png") ? "image/png" : full.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return { base64: data.toString("base64"), mime };
}
