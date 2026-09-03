import { describe, expect, it } from "vitest";
import pdfmake from "pdfmake/build/pdfmake";
import vfs from "pdfmake/build/vfs_fonts";
import { generateTechPackMock } from "@/lib/ai/providers/mock-techpack";
import { analyzeMock } from "@/lib/ai/providers/mock-analysis";
import { mapToUniversal } from "@/lib/universal/mapper";
import { computeReadiness } from "@/lib/universal/readiness";
import type { CommercialInputs } from "@/lib/ai/pipeline-types";
import type { Project, TechPack } from "@/lib/schemas/tech-pack";

pdfmake.addVirtualFileSystem(vfs);

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

export function createMockProject(): Project {
  const analysis = analyzeMock(demoInputs.description, demoInputs);
  const pack = generateTechPackMock(analysis, demoInputs);
  const universal = mapToUniversal({
    pack,
    analysis,
    project: {
      name: demoInputs.name ?? "Bucket Hat",
      description: demoInputs.description,
      brand_name: demoInputs.brand_name,
      quantity: demoInputs.quantity,
      sizes: demoInputs.sizes ?? [],
      colorways: demoInputs.colorways ?? [],
    },
    qaReport: null,
  });
  universal.readiness = computeReadiness(universal);

  return {
    id: "proj_test",
    brand_name: demoInputs.brand_name,
    name: demoInputs.name ?? "Bucket Hat",
    description: demoInputs.description,
    quantity: demoInputs.quantity,
    sizes: demoInputs.sizes ?? [],
    colorways: demoInputs.colorways ?? [],
    tech_pack: pack,
    universal,
    qa_report: {
      blocking_errors: [
        {
          code: "E_FABRIC_UNCONFIRMED",
          level: "blocking",
          message: "Fabric composition unconfirmed",
          guidance: "Specify exact composition",
        },
      ],
      warnings: [],
      info: [],
      checks_passed: 8,
      checks_total: 10,
      overall_score: 80,
      completeness_pct: 82,
      recommendations: [],
    },
    version: "V1.0",
    status: "DRAFT",
    analysis: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("PDF Generation for all modes", () => {
  for (const mode of ["buyer", "technical", "factory"] as const) {
    it(`generates valid PDF for ${mode} mode with complete project`, async () => {
      const project = createMockProject();
      const { buildDoc } = await import("@/lib/pdf/build-pdf");
      const doc = await buildDoc(project, project.tech_pack as TechPack, null, null, null, mode);
      const pdf = pdfmake.createPdf(doc);
      const base64 = await pdf.getBase64();
      expect(base64).toBeDefined();
      expect(base64.length).toBeGreaterThan(0);
    });

    it(`generates valid PDF for ${mode} mode when measurements and BOM are empty`, async () => {
      const project = createMockProject();
      if (project.tech_pack) {
        project.tech_pack.measurements = [];
        project.tech_pack.materials = [];
        project.tech_pack.bom = [];
        project.tech_pack.colorways = [];
        project.tech_pack.labels = [];
        project.tech_pack.packaging = [];
        project.tech_pack.construction = [];
        project.tech_pack.assumptions = [];
      }
      const { buildDoc } = await import("@/lib/pdf/build-pdf");
      const doc = await buildDoc(project, project.tech_pack as TechPack, null, null, null, mode);
      const pdf = pdfmake.createPdf(doc);
      const base64 = await pdf.getBase64();
      expect(base64).toBeDefined();
      expect(base64.length).toBeGreaterThan(0);
    });

    it(`generates valid PDF for ${mode} mode with non-standard / invalid image formats`, async () => {
      const project = createMockProject();
      const { buildDoc } = await import("@/lib/pdf/build-pdf");
      // Passing non-PNG/JPEG strings like webp, svg, corrupt data url or raw path
      const doc = await buildDoc(
        project,
        project.tech_pack as TechPack,
        "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/v3AAAA==",
        "/uploads/broken.webp",
        "data:image/svg+xml;utf8,<svg></svg>",
        mode
      );
      const pdf = pdfmake.createPdf(doc);
      const base64 = await pdf.getBase64();
      expect(base64).toBeDefined();
      expect(base64.length).toBeGreaterThan(0);
    });
  }
});
