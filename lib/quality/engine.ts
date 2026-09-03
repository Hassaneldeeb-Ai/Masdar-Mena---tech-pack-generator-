import type { QaIssue, QaReport, TechPack } from "@/lib/schemas/tech-pack";

export interface RunArgs {
  techPack: TechPack;
  sizes: string[];
  quantity?: number;
}

interface Check {
  id: string;
  run(ctx: { pack: TechPack; sizes: string[]; quantity?: number }): { pass: boolean; issue?: Omit<QaIssue, "code"> };
  weight?: number;
}

const has = (s: string | null | undefined) => !!s && s.trim().length > 0;

const CHECK_DEFS: Check[] = [
  {
    id: "required_product_name",
    run: ({ pack }) => ({
      pass: has(pack.product.name),
      issue: { level: "blocking", message: "Product name is missing.", field: "product.name", guidance: "Enter or confirm the product name." },
    }),
  },
  {
    id: "required_category",
    run: ({ pack }) => ({
      pass: has(pack.product.category),
      issue: { level: "blocking", message: "Product category is missing.", field: "product.category" },
    }),
  },
  {
    id: "required_materials",
    run: ({ pack }) => ({
      pass: pack.materials.length > 0,
      issue: { level: "blocking", message: "No materials defined.", field: "materials" },
    }),
  },
  {
    id: "required_bom",
    run: ({ pack }) => ({
      pass: pack.bom.length > 0,
      issue: { level: "blocking", message: "Bill of Materials is empty.", field: "bom" },
    }),
  },
  {
    id: "required_measurements",
    run: ({ pack }) => ({
      pass: pack.measurements.length > 0,
      issue: { level: "blocking", message: "No measurements defined.", field: "measurements" },
    }),
  },
  {
    id: "required_stitching",
    run: ({ pack }) => ({
      pass: has(pack.stitching?.primary_stitch),
      issue: { level: "blocking", message: "Stitching specification missing.", field: "stitching" },
    }),
  },
  {
    id: "measurements_cover_all_sizes",
    run: ({ pack, sizes }) => {
      const missing = pack.measurements.filter((m) => sizes.some((s) => m.values[s] === undefined));
      const missingSizes = Array.from(
        new Set(pack.measurements.flatMap((m) => sizes.filter((s) => m.values[s] === undefined)))
      );
      return {
        pass: missing.length === 0,
        issue: {
          level: "blocking",
          message: `Measurements are missing graded values for size(s): ${missingSizes.join(", ")}. POM points affected: ${missing.map((m) => m.id).join(", ")}.`,
          field: "measurements",
          guidance: "Every declared size must have a graded value at every POM point.",
        },
      };
    },
  },
  {
    id: "measurement_ranges_sane",
    run: ({ pack }) => {
      const bad = pack.measurements.filter((m) => {
        const vals = Object.values(m.values).filter((v) => typeof v === "number");
        return vals.some((v) => v < 4 || v > 160);
      });
      return {
        pass: bad.length === 0,
        issue: {
          level: "warning",
          message: `Measurements outside plausible garment range: ${bad.map((m) => m.id).join(", ")}.`,
          field: "measurements",
        },
      };
    },
  },
  {
    id: "measurement_grading_ascending",
    run: ({ pack }) => {
      const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
      const bad: string[] = [];
      for (const m of pack.measurements) {
        const sorted = order.filter((s) => m.values[s] !== undefined);
        for (let i = 1; i < sorted.length; i++) {
          if (m.values[sorted[i]]! < m.values[sorted[i - 1]]!) bad.push(m.id);
        }
      }
      return {
        pass: bad.length === 0,
        issue: {
          level: "warning",
          message: `Grading does not ascend by size: ${bad.join(", ")}.`,
          field: "measurements",
        },
      };
    },
  },
  {
    id: "reversible_two_layers",
    run: ({ pack }) => {
      const rev = pack.colorways.some((c) => c.reversible) || /revers/i.test(pack.product.description ?? "");
      const shells = pack.bom.filter((b) => /shell|lining|face/i.test(b.component_name));
      return {
        pass: !rev || shells.length >= 2,
        issue: {
          level: "blocking",
          message: "Reversible product must include both face layers in the BOM.",
          field: "bom",
        },
      };
    },
  },
  {
    id: "reversible_construction_section",
    run: ({ pack }) => {
      const rev = pack.colorways.some((c) => c.reversible) || /revers/i.test(pack.product.description ?? "");
      const hasSection = pack.construction.some((s) => /revers/i.test(s.section));
      return {
        pass: !rev || hasSection,
        issue: {
          level: "warning",
          message: "Reversible construction section missing from construction notes.",
          field: "construction",
        },
      };
    },
  },
  {
    id: "colorway_faces_differ",
    run: ({ pack }) => {
      const bad = pack.colorways
        .filter((c) => c.reversible)
        .filter((c) => c.face_b && c.face_a && c.face_a === c.face_b);
      return {
        pass: bad.length === 0,
        issue: {
          level: "warning",
          message: `Reversible colorways must have distinct faces: ${bad.map((c) => c.name).join(", ")}.`,
          field: "colorways",
        },
      };
    },
  },
  {
    id: "materials_nonempty",
    run: ({ pack }) => ({
      pass: pack.colorways.length > 0,
      issue: { level: "blocking", message: "No colorways defined.", field: "colorways" },
    }),
  },
  {
    id: "construction_nonempty",
    run: ({ pack }) => ({
      pass: pack.construction.length > 0,
      issue: { level: "warning", message: "Construction notes are empty.", field: "construction" },
    }),
  },
  {
    id: "labels_defined",
    run: ({ pack }) => ({
      pass: pack.labels.length > 0,
      issue: { level: "info", message: "No labels defined.", field: "labels", guidance: "Confirm legal/retail label requirements for the target market." },
    }),
  },
  {
    id: "qc_defined",
    run: ({ pack }) => ({
      pass: pack.quality_control.length > 0,
      issue: { level: "warning", message: "No quality-control checks defined.", field: "quality_control" },
    }),
  },
  {
    id: "packaging_defined",
    run: ({ pack }) => ({
      pass: pack.packaging.length > 0,
      issue: { level: "info", message: "No packaging defined.", field: "packaging" },
    }),
  },
  {
    id: "fabric_gsm_missing",
    run: ({ pack }) => {
      const missing = pack.materials.filter((m) => m.type === "fabric" && !m.gsm);
      return {
        pass: missing.length === 0,
        issue: {
          level: "warning",
          message: `Fabric weight (GSM) not specified for: ${missing.map((m) => m.name).join(", ")}.`,
          field: "materials",
          guidance: "Request GSM from the supplier; it drives needle selection, seam strength and wash behaviour.",
        },
      };
    },
  },
  {
    id: "fabric_composition_not_verified",
    run: ({ pack }) => {
      const unverified = pack.materials.filter(
        (m) => m.type === "fabric" && m.composition && m.composition.source !== "verified" && m.composition.source !== "user_provided"
      );
      return {
        pass: unverified.length === 0,
        issue: {
          level: "warning",
          message: "Exact fabric composition is not verified.",
          field: "materials",
          guidance: "Confirm composition with the fabric supplier before bulk order.",
        },
      };
    },
  },
  {
    id: "consumption_estimated",
    run: ({ pack }) => {
      const est = pack.bom.filter((b) => b.consumption_is_estimated);
      return {
        pass: est.length === 0,
        issue: {
          level: "warning",
          message: "Fabric consumption is estimated and requires marker validation.",
          field: "bom",
          guidance: "Run the approved pattern/marker to confirm consumption.",
        },
      };
    },
  },
  {
    id: "measurements_require_approval",
    run: ({ pack }) => ({
      pass: pack.measurements.every((m) => !m.requires_review),
      issue: {
        level: "warning",
        message: "Measurements are AI-proposed starting specifications and require pattern/sample approval.",
        field: "measurements",
        guidance: "Validate against an approved pattern and sample garment.",
      },
    }),
  },
  {
    id: "label_placement_unverified",
    run: ({ pack }) => {
      const noPlacement = pack.labels.filter((l) => !l.placement);
      return {
        pass: noPlacement.length === 0,
        issue: {
          level: "warning",
          message: "Label placement not visible in the source image.",
          field: "labels",
        },
      };
    },
  },
  {
    id: "quantity_defined",
    run: ({ quantity }) => ({
      pass: !!quantity,
      issue: {
        level: "info",
        message: "Production quantity not specified.",
        field: "product.quantity",
        guidance: "Quantity drives ordering and MOQ decisions.",
      },
    }),
  },
  {
    id: "no_hardware",
    run: ({ pack }) =>
      pack.materials.some((m) => m.type === "hardware")
        ? { pass: true }
        : {
            pass: true,
            issue: { level: "info", message: "No hardware detected." },
          },
  },
  {
    id: "tolerance_defined",
    run: ({ pack }) => {
      const missing = pack.measurements.filter((m) => !m.tolerance);
      return {
        pass: missing.length === 0,
        issue: {
          level: "warning",
          message: `${missing.length} measurement${missing.length > 1 ? "s" : ""} missing a tolerance.`,
          field: "measurements",
          guidance: "Every POM should have an acceptable deviation for quality control.",
        },
      };
    },
  },
  {
    id: "colorway_code_defined",
    run: ({ pack }) => {
      const missing = pack.colorways.filter((c) => !c.code);
      return {
        pass: missing.length === 0,
        issue: {
          level: "warning",
          message: `${missing.length} colourway${missing.length > 1 ? "s" : ""} missing a colour code.`,
          field: "colorways",
          guidance: "Colourways should carry a code (e.g. Pantone or hex) for supplier quoting.",
        },
      };
    },
  },
  {
    id: "intended_use_defined",
    run: ({ pack }) => ({
      pass: !!pack.product.intended_use,
      issue: {
        level: "info",
        message: "Intended use not specified.",
        field: "product.intended_use",
        guidance: "Intended use drives fabric and finish choices.",
      },
    }),
  },
  {
    id: "care_label_content",
    run: ({ pack }) => {
      const care = pack.labels.find((l) => l.type === "Care" || /care/i.test(l.name));
      return {
        pass: !!care?.content,
        issue: {
          level: "info",
          message: "Care label has no content specified.",
          field: "labels",
          guidance: "Confirm care instructions during prototype review.",
        },
      };
    },
  },
];

export function runQaChecks(args: RunArgs): QaReport {
  const { techPack: pack, sizes, quantity } = args;
  const blocking: QaIssue[] = [];
  const warnings: QaIssue[] = [];
  const info: QaIssue[] = [];
  let passed = 0;

  for (const check of CHECK_DEFS) {
    const res = check.run({ pack, sizes, quantity });
    if (res.pass) {
      passed++;
      continue;
    }
    const issue: QaIssue = { code: check.id, ...res.issue! };
    if (issue.level === "blocking") blocking.push(issue);
    else if (issue.level === "warning") warnings.push(issue);
    else info.push(issue);
  }

  const total = CHECK_DEFS.length;
  const completeness = Math.round((passed / total) * 100);
  const penalty = blocking.length * 25 + warnings.length * 5 + info.length * 0;
  const score = Math.max(0, Math.min(100, completeness - penalty + (blocking.length ? -5 : 0)));

  return {
    blocking_errors: blocking,
    warnings,
    info,
    checks_passed: passed,
    checks_total: total,
    overall_score: score,
    completeness_pct: completeness,
    recommendations: [
      ...(blocking.length ? ["Resolve all blocking errors before export."] : []),
      ...(warnings.some((w) => w.code === "fabric_gsm_missing") ? ["Request fabric GSM from the supplier."] : []),
      ...(warnings.some((w) => w.code === "measurements_require_approval") ? ["Validate measurements against pattern/sample."] : []),
    ],
  };
}
