import type { Readiness, CoreProductSpec } from "@/lib/schemas/universal";

interface ModuleResult {
  module: string;
  pct: number;
  weight: number;
  status: "APPLICABLE" | "N_A";
}

function pct(parts: number[]): number {
  if (parts.length === 0) return 0;
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}

/**
 * Factory readiness uses actual completeness per module. Modules with no data
 * at all are marked N/A and excluded — never punished (spec §34).
 */
export function computeReadiness(spec: CoreProductSpec): Readiness {
  const mods: ModuleResult[] = [];
  const blockers: string[] = [];

  // Product definition
  const defParts = [spec.product.name ? 1 : 0, spec.product.category ? 1 : 0, spec.product.description ? 1 : 0, spec.product.quantity ? 1 : 0];
  mods.push({ module: "Product Definition", pct: pct(defParts), weight: 0.15, status: "APPLICABLE" });
  if (pct(defParts) < 100) blockers.push("Product definition incomplete (name/category/quantity).");

  // Components
  mods.push({ module: "Components", pct: spec.components.length > 0 ? 100 : 0, weight: 0.1, status: spec.components.length > 0 ? "APPLICABLE" : "N_A" });
  if (spec.components.length === 0) blockers.push("No components identified.");

  // Materials
  const matOk = spec.materials.length > 0 ? pct(spec.materials.map((m) => (m.composition ? 1 : 0))) : 0;
  const matGsm = spec.materials.length > 0 ? pct(spec.materials.map((m) => (m.gsm ? 1 : 0))) : 0;
  // gsm is only expected on fabrics
  const gsmExpected = spec.materials.some((m) => m.type === "fabric");
  const matPct = spec.materials.length > 0
    ? Math.round(matOk * 0.5 + (gsmExpected ? matGsm : 100) * 0.5)
    : 0;
  mods.push({ module: "Materials", pct: matPct, weight: 0.2, status: spec.materials.length > 0 ? "APPLICABLE" : "N_A" });
  if (spec.materials.length > 0 && matOk < 100) blockers.push(`${spec.materials.filter((m) => !m.composition).length} material composition entries unresolved.`);
  if (gsmExpected && matGsm < 100) blockers.push("Fabric weights (GSM) unresolved.");

  // Dimensions
  const dimOk = spec.dimensions.length > 0 ? pct(spec.dimensions.map((d) => (d.value.nominal > 0 ? 1 : 0))) : 0;
  const dimTol = spec.dimensions.length > 0 ? pct(spec.dimensions.map((d) => (d.value.tolerance ? 1 : 0))) : 0;
  const dimSizes = spec.dimensions.length > 0 ? pct(spec.dimensions.map((d) => (d.per_size && Object.keys(d.per_size).length > 0 ? 1 : 0))) : 0;
  mods.push({
    module: "Dimensions",
    pct: Math.min(100, Math.round((dimOk * 0.5 + dimTol * 0.2 + dimSizes * 0.3))),
    weight: 0.2,
    status: spec.dimensions.length > 0 ? "APPLICABLE" : "N_A",
  });
  if (spec.dimensions.length === 0) blockers.push("No dimensions defined.");
  else if (dimTol < 100) blockers.push("One or more dimensions missing a tolerance.");

  // Assembly
  const asm = spec.assembly_sequence.length > 0;
  mods.push({ module: "Assembly", pct: asm ? 100 : 0, weight: 0.12, status: asm ? "APPLICABLE" : "N_A" });
  if (!asm) blockers.push("Assembly sequence not defined.");

  // Manufacturing
  const manu = spec.manufacturing.length > 0;
  mods.push({ module: "Manufacturing", pct: manu ? 90 : 0, weight: 0.08, status: manu ? "APPLICABLE" : "N_A" });

  // Quality
  const qcDefined = spec.extensions.qc_count ? Number(spec.extensions.qc_count) > 0 : 0;
  const qcCount = qcDefined as number;
  mods.push({ module: "Quality", pct: qcCount ? 100 : 0, weight: 0.1, status: qcCount ? "APPLICABLE" : "N_A" });
  if (!qcCount) blockers.push("QC requirements missing.");

  // Packaging
  const pk = spec.packaging.length > 0;
  mods.push({ module: "Packaging", pct: pk ? 100 : 0, weight: 0.05, status: pk ? "APPLICABLE" : "N_A" });
  if (!pk) blockers.push("Packaging not specified.");

  // Compliance
  const comp = spec.compliance.length > 0;
  mods.push({ module: "Compliance", pct: comp ? 80 : 0, weight: 0.03, status: comp ? "APPLICABLE" : "N_A" });

  // Performance — never punish when nothing functional is declared
  mods.push({ module: "Performance", pct: spec.function_spec.length > 0 ? 100 : 0, weight: 0, status: spec.function_spec.length > 0 ? "APPLICABLE" : "N_A" });

  const applicable = mods.filter((m) => m.status === "APPLICABLE");
  const totalW = mods.reduce((a, m) => a + m.weight, 0);
  const score = totalW > 0 ? Math.round(applicable.reduce((a, m) => a + m.pct * m.weight, 0) / totalW) : 0;

  const designComplete = score >= 60;
  const technicallyReviewed = score >= 70 && blockers.length === 0;
  const sampleReady = score >= 70 && blockers.filter((b) => !/composition|GSM/.test(b)).length === 0;
  const productionReady = score >= 90 && blockers.length === 0;

  const reasons: string[] = [];
  if (blockers.length > 0) reasons.push(`${blockers.length} outstanding blocker${blockers.length > 1 ? "s" : ""}: ${blockers.slice(0, 3).join(" · ")}`);
  if (!sampleReady) reasons.push("Sample gate not cleared — see blockers above.");

  return {
    factory_ready: { score, dimensions: mods, blockers },
    sample_ready: { design_complete: designComplete, technically_reviewed: technicallyReviewed, sample_ready: sampleReady, production_ready: productionReady, reasons },
    stage: "DEVELOPMENT",
    approval_status: "AI_DRAFT",
  };
}
