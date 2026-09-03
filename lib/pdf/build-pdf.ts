import type {
  Content,
  ContentTable,
  TableLayout,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import type { Project, TechPack } from "@/lib/schemas/tech-pack";
import type { CoreProductSpec } from "@/lib/schemas/universal";
import { buildFlatDrawingSvg } from "./flat-drawing";
import {
  buildCareLabelSvg,
  buildFrontSketchSvg,
  buildBackSketchSvg,
  buildConstructionGuideSvg,
  buildMaterialSwatchSvg,
  buildSizeChartSvg,
} from "./illustrations";
import { computeCostSheet } from "./costing";
import { formatDateTime } from "@/lib/format";

const INK = "#1c1917";
const MUTED = "#78716c";
const LINE = "#d6d3d1";
const AMBER_BG = "#fef3c7";
const AMBER_TEXT = "#92400e";

async function loadImageDataUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.type.includes("svg")) {
      return await rasterizeSvg(await blob.text());
    }
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function rasterizeSvg(svgText: string): Promise<string | null> {
  try {
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("svg load failed"));
        el.src = url;
      });
      const size = 800;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

export type PdfMode = "technical" | "buyer" | "factory";

const MODE_LABEL: Record<PdfMode, string> = {
  technical: "MANUFACTURING TECH PACK",
  buyer: "BUYER PRESENTATION",
  factory: "FACTORY COPY — PRODUCTION REFERENCE",
};

export async function buildPdf(project: Project, mode: PdfMode = "technical"): Promise<void> {
  const [pdfmakeMod, vfsMod] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const pdfmake = pdfmakeMod.default;
  pdfmake.addVirtualFileSystem(vfsMod.default);

  const pack = project.tech_pack as TechPack;
  const image = await loadImageDataUrl(project.image_path);
  const backImage = await loadImageDataUrl(project.image_back_path);
  const sketch = await rasterizeSvg(buildFlatDrawingSvg(pack));
  const doc = await buildDoc(project, pack, image, backImage, sketch, mode);
  const filename = `tech-pack-${pack.product.code || project.id}-v${pack.version}.pdf`;
  pdfmake.createPdf(doc).download(filename);
}

/** Build the same document and return an object URL for live in-app preview. */
export async function buildPdfBlobUrl(project: Project, mode: PdfMode = "technical"): Promise<string> {
  const [pdfmakeMod, vfsMod] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const pdfmake = pdfmakeMod.default;
  pdfmake.addVirtualFileSystem(vfsMod.default);

  const pack = project.tech_pack as TechPack;
  const image = await loadImageDataUrl(project.image_path);
  const backImage = await loadImageDataUrl(project.image_back_path);
  const sketch = await rasterizeSvg(buildFlatDrawingSvg(pack));
  const doc = await buildDoc(project, pack, image, backImage, sketch, mode);
  const base64 = await pdfmake.createPdf(doc).getBase64();
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
}

async function buildDoc(
  project: Project,
  pack: TechPack,
  image: string | null,
  backImage: string | null,
  sketch: string | null = null,
  mode: PdfMode = "technical"
): Promise<TDocumentDefinitions> {
  const footer = (current: number, total: number): Content => ({
    columns: [
      {
        text: `TECH PACK ${pack.version} — AI GENERATED — HUMAN REVIEW REQUIRED`,
        fontSize: 7.5,
        color: MUTED,
      },
      { text: `Page ${current} of ${total}`, fontSize: 7.5, color: MUTED, alignment: "right" },
    ],
    margin: [56, 0, 56, 18],
  });

  const rast = async (svg: string): Promise<string | null> => rasterizeSvg(svg);
  const [frontSk, backSk, guideSk, sizeSk, careSk] = await Promise.all([
    rast(buildFrontSketchSvg(pack)),
    rast(buildBackSketchSvg(pack)),
    rast(buildConstructionGuideSvg(pack, "front")),
    rast(buildSizeChartSvg(pack, project.sizes ?? [])),
    rast(buildCareLabelSvg(pack)),
  ]);
  const swatches = await Promise.all(pack.materials.map((m) => rast(buildMaterialSwatchSvg(m))));

  return {
    pageSize: "A4",
    pageMargins: [56, 56, 56, 56],
    defaultStyle: { font: "Roboto", fontSize: 9.5, color: INK, lineHeight: 1.35 },
    footer,
    content:
      mode === "buyer"
        ? [
            ...coverPage(project, pack, image, backImage, mode),
            ...specPage(project, pack),
            ...illustrationsPage(project, pack, frontSk, backSk, guideSk, careSk),
            ...colorwaysPage(pack),
            ...(project.universal ? readinessPage(project.universal) : []),
            ...assumptionsPage(project, pack),
          ]
        : [
            ...coverPage(project, pack, image, backImage, mode),
            ...specPage(project, pack),
            ...(project.universal ? anatomyPage(project.universal) : []),
            ...(project.universal ? requirementsPage(project.universal) : []),
            ...illustrationsPage(project, pack, frontSk, backSk, guideSk, careSk),
            ...bomPage(pack, swatches),
            ...measurementsPage(project, pack, sketch, sizeSk),
            ...constructionPage(pack),
            ...colorwaysPage(pack),
            ...qcPage(pack),
            ...costSheetPage(project, pack),
            ...(project.universal ? readinessPage(project.universal) : []),
            ...assumptionsPage(project, pack),
          ],
    styles: {
      h1: { fontSize: 20, bold: true },
      h2: { fontSize: 13, bold: true, margin: [0, 0, 0, 8] },
      h3: { fontSize: 10.5, bold: true, margin: [0, 10, 0, 4] },
      small: { fontSize: 8, color: MUTED },
    },
  };
}

function aiBanner(): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: "AI GENERATED — HUMAN REVIEW REQUIRED",
            bold: true,
            fontSize: 9,
            color: AMBER_TEXT,
            fillColor: AMBER_BG,
            alignment: "center",
            margin: [0, 6, 0, 6],
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 14],
  };
}

function heading(text: string): Content {
  return { text, style: "h2", margin: [0, 0, 0, 10], pageBreakBefore: true } as Content;
}

function kvTable(rows: [string, Content][]): Content {
  return {
    table: {
      widths: [130, "*"],
      body: rows.map(([k, v]) => [
        { text: k, bold: true, fontSize: 8.5, color: MUTED },
        v,
      ]),
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => LINE,
      vLineColor: () => LINE,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  };
}

function dataTable(
  header: string[],
  rows: Content[][],
  widths: string[]
): Content {
  const layout: TableLayout = {
    hLineWidth: (i: number, node: ContentTable) =>
      i === 0 || i === 1 || i === node.table.body.length ? 0.75 : 0.4,
    vLineWidth: () => 0.4,
    hLineColor: (i: number) => (i <= 1 ? INK : LINE),
    vLineColor: () => LINE,
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 3.5,
    paddingBottom: () => 3.5,
  };
  return {
    table: {
      headerRows: 1,
      widths,
      body: [
        header.map((h) => ({ text: h, bold: true, fontSize: 8, fillColor: "#f5f5f4" })),
        ...rows,
      ],
    },
    layout,
  };
}
function coverPage(project: Project, pack: TechPack, image: string | null, backImage: string | null, mode: PdfMode = "technical"): Content[] {
  const qa = project.qa_report;
  const product = pack.product;
  const content: Content[] = [
    aiBanner(),
    { text: MODE_LABEL[mode], fontSize: 9, color: MUTED, characterSpacing: 2 },
    { text: product.name, style: "h1", margin: [0, 4, 0, 2] },
    {
      text: [product.brand, product.category, product.product_type]
        .filter(Boolean)
        .join("  ·  "),
      fontSize: 10,
      color: MUTED,
      margin: [0, 0, 0, 16],
    },
  ];

  if (image || backImage) {
    const imgs: Content[] = [];
    if (image) imgs.push({ image, width: 225 });
    if (backImage) imgs.push({ image: backImage, width: 225 });
    content.push({
      columns: imgs,
      alignment: "center",
      margin: [0, 0, 0, 12],
    });
    content.push({
      columns: [
        { text: image ? "FIG. 1 — FRONT VIEW" : "", fontSize: 7.5, color: MUTED, alignment: "center" },
        { text: backImage ? "FIG. 2 — BACK VIEW" : "", fontSize: 7.5, color: MUTED, alignment: "center" },
      ] as Content[],
      margin: [0, 0, 0, 16],
    });
  }

  content.push(
    kvTable([
      ["Style code", product.code ?? "—"],
      ["Version", `${pack.version} (revision ${product.revision ?? pack.version})`],
      ["Generated", formatDateTime(pack.generated_at)],
      ["Status", "AI generated — requires human review before approval"],
      ["Sizes", (project.sizes ?? []).join(", ") || "—"],
      [
        "Colourways",
        pack.colorways.map((c) => `${c.number} ${c.name}`).join(", ") || "—",
      ],
      ["Production quantity", product.quantity != null ? String(product.quantity) + " units" : "—"],
      ["QA completeness", qa ? `${qa.completeness_pct}% (${qa.checks_passed}/${qa.checks_total} checks)` : "—"],
      [
        "Open issues",
        qa
          ? `${qa.blocking_errors.length} blocking · ${qa.warnings.length} warnings`
          : "—",
      ],
    ]),
    { text: "Buyer description", style: "h3" },
    {
      text: project.description || "—",
      italics: true,
      color: MUTED,
    },
    project.notes
      ? { text: project.notes, style: "small", margin: [0, 8, 0, 0] }
      : ({} as Content)
  );
  return content;
}

function specPage(project: Project, pack: TechPack): Content[] {
  const s = pack.stitching;
  const stitch: [string, Content][] = [
    ["Primary stitch", s.primary_stitch ?? "—"],
  ];
  if (s.spi_text) stitch.push(["Stitches per inch", s.spi_text]);
  if (s.seam_allowance_text) stitch.push(["Seam allowance", s.seam_allowance_text]);
  if (s.topstitch) stitch.push(["Topstitch", s.topstitch]);
  if (s.thread) stitch.push(["Thread", s.thread]);
  if (s.needle) stitch.push(["Needle", s.needle]);
  stitch.push([
    "Provenance",
    `${s.source} · confidence ${Math.round(s.confidence * 100)}%`,
  ]);

  return [
    heading("Product specifications"),
    kvTable([
      ["Product", pack.product.name],
      ["Category", `${pack.product.category} · ${pack.product.product_type}`],
      ["Intended use", pack.product.intended_use ?? "—"],
      ["Target customer", pack.product.target_customer ?? "—"],
      ["Reversible", pack.colorways.some((c) => c.face_b) ? "Yes — two wearing sides" : "No"],
    ]),
    { text: "Stitch specification", style: "h3" },
    kvTable(stitch),
    { text: "Wash & care", style: "h3" },
    { text: "See care label content in Labels section; confirm final wording with brand.", style: "small" },
    project.notes ? { text: project.notes, style: "small" } : ({} as Content),
  ];
}

function illustrationsPage(
  project: Project,
  pack: TechPack,
  frontSk: string | null,
  backSk: string | null,
  guideSk: string | null,
  careSk: string | null
): Content[] {
  const content: Content[] = [heading("Product illustrations — flat sketches")];
  const cols: Content[] = [];
  if (frontSk) cols.push({ image: frontSk, width: 240 });
  if (backSk) cols.push({ image: backSk, width: 240 });
  if (cols.length) {
    content.push({
      columns: cols,
      alignment: "center",
      margin: [0, 0, 0, 6],
    });
    content.push({
      text: `FIG. 1 — front flat sketch${backSk ? "   ·   FIG. 2 — back flat sketch" : ""}. Generated from the POM measurements (scale approx.).`,
      fontSize: 7.5,
      color: MUTED,
      alignment: "center",
      margin: [0, 0, 0, 10],
    });
  } else {
    content.push({ text: "Sketches unavailable (image data missing).", style: "small" });
  }

  if (careSk) {
    content.push({ text: "Care label — ISO 3758 symbols", style: "h3" });
    content.push({
      columns: [
        { text: "", width: "*" },
        { image: careSk, width: 380, alignment: "center" },
        { text: "", width: "*" },
      ],
      margin: [0, 0, 0, 8],
    });
    content.push({
      text: "FIG. 4 — care symbols. Confirm final running order with the care-labelling standard of the target market.",
      fontSize: 7.5,
      color: MUTED,
      alignment: "center",
      margin: [0, 0, 0, 10],
    });
  }

  if (guideSk) {
    content.push({ text: "Construction guide", style: "h3" });
    content.push({
      columns: [
        { text: "", width: "*" },
        { image: guideSk, width: 300, alignment: "center" },
        { text: "", width: "*" },
      ],
      margin: [0, 0, 0, 6],
    });
    content.push({
      text: "FIG. 3 — construction guide. Numbered zones map to the construction notes below.",
      fontSize: 7.5,
      color: MUTED,
      alignment: "center",
      margin: [0, 0, 0, 6],
    });
  }
  return content;
}

function bomPage(pack: TechPack, swatches: Array<string | null>): Content[] {
  const materialRows: Content[][] = pack.materials.map((m, i) => [
    swatches[i]
      ? ({ image: swatches[i], fit: [44, 34] as [number, number], alignment: "center" } as Content)
      : { text: "—", alignment: "center" as const },
    { text: `${m.name} (${m.type})` },
    { text: m.composition.value },
    { text: m.gsm ? m.gsm.value : "TBD" },
    { text: m.width_cm ? m.width_cm.value : "TBD" },
    { text: m.color ?? m.notes ?? "" },
    { text: m.composition.source, color: MUTED, fontSize: 7 },
    { text: m.supplier ? `${m.supplier.name}${m.supplier.material_code ? ` · ${m.supplier.material_code}` : ""}${m.supplier.approval_status ? ` (${m.supplier.approval_status})` : ""}` : "—", color: MUTED, fontSize: 7 },
  ]);

  const bomRows: Content[][] = pack.bom.map((row, i) => [
    { text: String(i + 1) },
    { text: row.component_name },
    { text: row.material_name },
    { text: row.specification },
    { text: row.unit },
    {
      text: `${row.consumption}${row.consumption_is_estimated ? " (est.)" : ""}`,
      color: row.consumption_is_estimated ? AMBER_TEXT : INK,
    },
    { text: row.color ?? "" },
  ]);

  return [
    heading("Bill of materials"),
    { text: "Materials & trims", style: "h3" },
    dataTable(
      ["Swatch", "Material", "Composition", "GSM", "Width (cm)", "Colour", "Source", "Supplier"],
      materialRows,
      ["60", "auto", "*", "auto", "auto", "auto", "auto", "auto"]
    ),
    { text: "Consumption (BOM)", style: "h3" },
    dataTable(
      ["#", "Component", "Material", "Specification", "Unit", "Consumption", "Colour"],
      bomRows,
      ["auto", "auto", "auto", "*", "auto", "auto", "auto"]
    ),
    {
      text: "Swatch imagery is illustrative (deterministic render from spec). Consumption values marked (est.) are AI estimates and must be validated with a marker run before costing is final.",
      style: "small",
      margin: [0, 6, 0, 0],
    },
  ];
}

function measurementsPage(project: Project, pack: TechPack, sketch: string | null = null, sizeSketch: string | null = null): Content[] {
  const sizes = project.sizes ?? [];
  const widths = ["auto", "*", ...sizes.map(() => "auto"), "auto", "auto"];
  const header = ["POM", "Description", ...sizes, "Tol.", "Source"];
  const rows: Content[][] = pack.measurements.map((m) => [
    { text: m.id, bold: true },
    { text: m.how_to_measure || m.name, fontSize: 8 },
    ...sizes.map((size) => ({
      text: m.values[size] != null ? String(m.values[size]) : "TBD",
      alignment: "center" as const,
    })),
    { text: m.tolerance, alignment: "center" as const },
    { text: m.source, color: MUTED, fontSize: 7 },
  ]);

  const content: Content[] = [heading("Measurement specification (POM) & size chart")];
  if (sketch) {
    content.push({
      columns: [
        { text: "", width: "*" },
        { image: sketch, width: 300, alignment: "center" },
        { text: "", width: "*" },
      ],
      margin: [0, 0, 0, 10],
    });
    content.push({
      text: "FIG. 1 — POM VIEW (top). Brim, crown and head-opening breakpoints as per measurement table.",
      fontSize: 7.5,
      color: MUTED,
      alignment: "center",
      margin: [0, -4, 0, 10],
    });
  }
  content.push(dataTable(header, rows, widths));
  content.push({
    text: `All measurements in ${pack.measurements[0]?.unit ?? "cm"}, laid flat unless stated. Values are AI-proposed from industry norms for this silhouette and require sample validation.`,
    style: "small",
    margin: [0, 6, 0, 0],
  });

  if (sizeSketch) {
    content.push({ text: "Size chart visual", style: "h3" });
    content.push({
      columns: [
        { text: "", width: "*" },
        { image: sizeSketch, width: 380, alignment: "center" },
        { text: "", width: "*" },
      ],
      margin: [0, 0, 0, 6],
    });
    content.push({
      text: "FIG. 2 — size chart. Bar length = value relative to each POM's smallest→largest range.",
      fontSize: 7.5,
      color: MUTED,
      alignment: "center",
      margin: [0, -4, 0, 4],
    });
  }

  const gradeRows: Content[][] = [];
  for (const mm of pack.measurements) {
    const vals = sizes.map((s) => mm.values[s]).filter((v): v is number => typeof v === "number");
    if (vals.length < 2) continue;
    const span = Math.max(...vals) - Math.min(...vals);
    const step = span / (vals.length - 1);
    const constant = vals.every((v, i) => i === 0 || Math.abs(v - vals[i - 1] - step) < 0.05);
    gradeRows.push([
      { text: mm.id, bold: true },
      { text: mm.name, fontSize: 8 },
      { text: constant ? `+${step.toFixed(1)} cm / size` : "varies", alignment: "center" as const },
      {
        text: constant
          ? `from smallest to largest: ±${(span / 2).toFixed(1)} cm about the base size`
          : `total range ${span.toFixed(1)} cm`,
        fontSize: 8,
        color: MUTED,
      },
    ]);
  }

  if (gradeRows.length) {
    content.push({ text: "Grading rules", style: "h3" });
    content.push(dataTable(["POM", "Point", "Grade step", "Basis"], gradeRows, ["auto", "*", "auto", "*"]));
    content.push({
      text: "Grade steps are computed from adjacent size values in the POM table. Confirm against the approved grading plan and final pattern.",
      style: "small",
      margin: [0, 4, 0, 0],
    });
  }
  return content;
}

function constructionPage(pack: TechPack): Content[] {
  const content: Content[] = [heading("Construction detail")];
  for (const section of pack.construction) {
    content.push({ text: section.section, style: "h3" });
    content.push({
      ol: section.items.map((item) => ({ text: item, fontSize: 9 })),
    });
  }
  return content;
}

function colorwaysPage(pack: TechPack): Content[] {
  const rows: Content[][] = pack.colorways.map((c) => [
    { text: c.number, bold: true },
    { text: c.name },
    { text: c.code ?? "—" },
    { text: c.pantone ?? "—" },
    { text: c.face_a ?? "—" },
    { text: c.face_b ?? (c.reversible ? "TBD" : "—") },
    { text: c.reversible ? "Reversible" : "—", fontSize: 8 },
  ]);

  return [
    heading("Colourways"),
    dataTable(
      ["#", "Name", "Hex ref.", "Pantone FHI/TCX", "Face A", "Face B", "Type"],
      rows,
      ["auto", "auto", "auto", "auto", "auto", "auto", "auto"]
    ),
    {
      text: "Face A = outer shell colour, Face B = inner shell colour. Confirm hex/Pantone references with the dye house before bulk dyeing.",
      style: "small",
      margin: [0, 6, 0, 0],
    },
  ];
}

function qcPage(pack: TechPack): Content[] {
  const content: Content[] = [heading("Quality control")];
  const categories = Array.from(new Set(pack.quality_control.map((q) => q.category)));
  for (const category of categories) {
    content.push({ text: category, style: "h3" });
    content.push({
      ol: pack.quality_control
        .filter((q) => q.category === category)
        .map((q) => ({
          text:
            `${q.check}` +
            (q.method ? ` — ${q.method}` : "") +
            (q.standard ? ` (standard: ${q.standard})` : ""),
          fontSize: 9,
        })),
    });
  }

  content.push({ text: "Labels", style: "h3" });
  content.push(
    dataTable(
      ["Label", "Type", "Placement", "Required"],
      pack.labels.map((l) => [
        { text: l.name },
        { text: l.type },
        { text: l.placement ?? "TBD" },
        { text: l.required ? "Yes" : "No" },
      ]),
      ["*", "auto", "*", "auto"]
    )
  );

  content.push({ text: "Packaging", style: "h3" });
  content.push(
    dataTable(
      ["Item", "Spec", "Unit", "Qty"],
      pack.packaging.map((p) => [
        { text: p.item },
        { text: p.spec },
        { text: p.unit },
        { text: String(p.quantity) },
      ]),
      ["*", "auto", "auto", "auto"]
    )
  );
  return content;
}

function sectionRow(label: string, value: number): Content[] {
  const shown = Number.isFinite(value) ? value.toFixed(2) : "TBD";
  // Four explicit cells — no colSpan, so pdfmake never has to fill spans.
  return [
    { text: label, bold: true, fillColor: "#f5f4f8" },
    { text: "", fillColor: "#f5f4f8" },
    { text: "", fillColor: "#f5f4f8" },
    { text: shown, bold: true, alignment: "right" as const, fillColor: "#f5f4f8" },
  ];
}

export function buildCostTableRows(cs: ReturnType<typeof computeCostSheet>): Content[][] {
  const rows: Content[][] = cs.lines.map((l) => [
    { text: l.item },
    { text: l.basis },
    { text: l.unit },
    { text: l.total, alignment: "right" as const },
  ]);
  rows.push(
    sectionRow("Materials subtotal", cs.materialTotal),
    sectionRow("Labour (CMT)", cs.labourTotal),
    sectionRow(`Overhead (${Math.round(0.15 * 100)}%)`, cs.overheadTotal)
  );
  return rows;
}

function costSheetPage(project: Project, pack: TechPack): Content[] {
  const cs = computeCostSheet(pack, Number(project.quantity ?? 0) || 1);
  const rows = buildCostTableRows(cs);
  return [
    heading("Estimated cost sheet"),
    dataTable(["Component", "Consumption basis", "Unit", "Cost"], rows, ["*", "auto", "auto", "auto"]),
    {
      text: [
        { text: `Est. unit cost: `, bold: true },
        { text: `${cs.currency} ${cs.perUnitRounded.toFixed(2)} / unit`, bold: true },
        { text: `   ·   Est. total (${cs.qty} units): ${cs.currency} ${cs.grandTotal.toFixed(2)}`, bold: true },
      ],
      fontSize: 10,
      margin: [0, 8, 0, 4],
    },
    {
      text: "This cost sheet uses ASSUMPTION unit prices (fabric €6.50/m, trims €0.35/patch, labour CMT) and is a quoting starting point — NOT a quotation. Replace every price with a supplier quotation before submission.",
      style: "small",
      margin: [0, 4, 0, 0],
    },
    {
      text: `Costing inputs: ${cs.lines.length} BOM lines from the consumption table. Quantities marked (est.) must be validated with a marker run.`,
      style: "small",
      color: MUTED,
      margin: [0, 4, 0, 0],
    },
  ];
}

function assumptionsPage(project: Project, pack: TechPack): Content[] {
  const qa = project.qa_report;
  const content: Content[] = [
    heading("Assumptions, warnings & revision control"),
    { text: "AI assumptions", style: "h3" },
    {
      ul: pack.assumptions.map((a) => ({
        text:
          `${a.statement}` +
          (a.category ? ` [${a.category}]` : "") +
          ` — confidence ${Math.round(a.confidence * 100)}%, impact: ${a.impact}. ${a.required_action ?? ""}`,
        fontSize: 9,
        color: INK,
      })),
    },
  ];

  if (qa && qa.blocking_errors.length > 0) {
    content.push({ text: "Blocking issues", style: "h3" });
    content.push({
      ul: qa.blocking_errors.map((e) => ({
        text: e.message + (e.guidance ? ` — ${e.guidance}` : ""),
        fontSize: 9,
        color: "#b91c1c",
      })),
    });
  }

  if (qa && qa.warnings.length > 0) {
    content.push({ text: "Warnings", style: "h3" });
    content.push({
      ul: qa.warnings.map((w) => ({
        text: w.message + (w.guidance ? ` — ${w.guidance}` : ""),
        fontSize: 9,
      })),
    });
  }

  content.push(
    {
      text: "Revision control: this document was produced with AI assistance from the buyer's image and description. Every inferred or assumed value must be confirmed by the brand's technical team before factory submission. Human edits are recorded in the revision log of the source application and bump the pack version.",
      style: "small",
      margin: [0, 14, 0, 0],
    }
  );
  return content;
}

function anatomyPage(spec: CoreProductSpec): Content[] {
  const content: Content[] = [heading("PRODUCT ANATOMY")];
  if (spec.components.length === 0) {
    content.push({ text: "Not provided — no components were identified.", style: "small" });
  } else {
    content.push({
      ul: spec.components.map((c) => ({
        text:
          `${c.name} — ${c.type}` +
          (c.parent_id ? ` (${c.parent_id})` : "") +
          (c.function ? ` · ${c.function}` : "") +
          (c.material_ref ? ` · ${c.material_ref}` : "") +
          ` · ${c.source} · ${c.confidence}`,
        fontSize: 9,
      })),
    });
  }
  if (spec.assembly_sequence.length > 0) {
    content.push({ text: "Assembly sequence", style: "h3" });
    content.push(
      dataTable(
        ["Step", "Operation", "Machine", "Description"],
        spec.assembly_sequence.map((o) => [
          { text: `${o.step}`, fontSize: 8.5, alignment: "center" },
          { text: o.operation, fontSize: 8.5 },
          { text: o.machine ?? "—", fontSize: 8.5 },
          { text: o.description, fontSize: 8.5 },
        ]),
        ["40", "70", "80", "*"]
      )
    );
  }
  if (spec.visuals_plan.length > 0) {
    content.push({ text: "Visual asset plan", style: "h3" });
    content.push(
      dataTable(
        ["Asset", "Type", "Status", "Generation"],
        spec.visuals_plan.map((v) => [
          { text: v.id, fontSize: 8.5, alignment: "center" },
          { text: v.type, fontSize: 8.5 },
          { text: v.status, fontSize: 8.5 },
          { text: v.generation, fontSize: 8.5 },
        ]),
        ["90", "130", "90", "90"]
      )
    );
  }
  return content;
}

function requirementsPage(spec: CoreProductSpec): Content[] {
  const content: Content[] = [heading("REQUIREMENTS MATRIX")];
  if (spec.requirements.length === 0) {
    content.push({ text: "Not provided — no requirements defined.", style: "small" });
    return content;
  }
  const statusColor = (s: string) =>
    s === "PASS" ? "#0c9358" : s === "FAIL" ? "#bc3838" : s === "WARNING" || s === "REVIEW" ? "#6d4aff" : MUTED;
  content.push(
    dataTable(
      ["ID", "Category", "Requirement", "Target", "Pri.", "Status", "Verification", "Trace"],
      spec.requirements.map((r) => [
        { text: r.id, fontSize: 8, bold: true, alignment: "center" },
        { text: r.category, fontSize: 8 },
        { text: r.statement, fontSize: 8 },
        { text: r.target ?? "—", fontSize: 8 },
        { text: r.priority, fontSize: 8, alignment: "center" },
        { text: r.status, fontSize: 8, bold: true, alignment: "center", color: statusColor(r.status) },
        { text: r.verification_method ?? "—", fontSize: 8 },
        {
          text: [r.traceability.component_ids, r.traceability.dimension_ids, r.traceability.qc_ids]
            .flat()
            .join(", ") || "—",
          fontSize: 8,
        },
      ]),
      ["46", "80", "*", "70", "28", "56", "80", "110"]
    )
  );
  content.push({
    text: `Total: ${spec.requirements.length} requirements (${spec.requirements.filter((r) => r.status === "PASS").length} passing).`,
    style: "small",
    margin: [0, 6, 0, 0],
  });
  return content;
}

function readinessPage(spec: CoreProductSpec): Content[] {
  const content: Content[] = [heading("FACTORY READINESS")];
  const r = spec.readiness;
  if (!r) {
    content.push({ text: "Readiness not computed.", style: "small" });
    return content;
  }
  content.push({
    text: `${r.factory_ready.score} / 100`,
    style: "h1",
    fontSize: 24,
    color: r.factory_ready.score >= 90 ? "#0c9358" : r.factory_ready.score >= 60 ? INK : "#bc3838",
  });
  content.push(
    dataTable(
      ["Module", "Score", "Status"],
      r.factory_ready.dimensions.map((d) => [
        { text: d.module, fontSize: 8.5 },
        { text: d.status === "N_A" ? "—" : `${d.pct}%`, fontSize: 8.5, alignment: "center" },
        { text: d.status, fontSize: 8.5, alignment: "center" },
      ]),
      ["*", "80", "80"]
    )
  );
  if (r.factory_ready.blockers.length > 0) {
    content.push({ text: "Blockers", style: "h3" });
    content.push({
      ul: r.factory_ready.blockers.map((b) => ({ text: b, fontSize: 8.5, color: "#bc3838" })),
    });
  }
  content.push({ text: "Sample gates", style: "h3" });
  const gates: [string, boolean][] = [
    ["Design complete", r.sample_ready.design_complete],
    ["Technically reviewed", r.sample_ready.technically_reviewed],
    ["Sample ready", r.sample_ready.sample_ready],
    ["Production ready", r.sample_ready.production_ready],
  ];
  content.push(
    dataTable(
      ["Gate", "Status"],
      gates.map(([label, ok]) => [
        { text: label, fontSize: 8.5 },
        { text: ok ? "✓ PASS" : "✕ NOT YET", fontSize: 8.5, bold: true, color: ok ? "#0c9358" : "#bc3838" },
      ]),
      ["*", "100"]
    )
  );
  if (r.sample_ready.reasons.length > 0) {
    content.push({
      ul: r.sample_ready.reasons.map((x) => ({ text: x, fontSize: 8.5 })),
    });
  }
  content.push({
    text: `Stage: ${r.stage} · Approval: ${r.approval_status}. Readiness is an honest completeness score, not an engineering approval.`,
    style: "small",
    margin: [0, 10, 0, 0],
  });
  return content;
}
