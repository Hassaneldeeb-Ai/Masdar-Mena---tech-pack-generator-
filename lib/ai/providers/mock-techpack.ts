import type {
  Colorway,
  Label,
  Material,
  ProductAnalysis,
  TechPack,
} from "@/lib/schemas/tech-pack";
import type { CommercialInputs } from "../pipeline-types";
import { bucketHatMeasurements } from "./mock-analysis";

const est = (value: string, confidence = 0.7, note?: string) => ({
  value,
  source: "inferred" as const,
  confidence,
  requires_review: true,
  ...(note ? { note } : {}),
});

/** Build the deterministic tech pack for the mock pipeline. */
export function generateTechPackMock(
  analysis: ProductAnalysis,
  inputs: CommercialInputs
): TechPack {
  const now = new Date().toISOString();
  const sizes = inputs.sizes.length > 0 ? inputs.sizes : ["S", "M", "L"];
  const isBucket = analysis.product_type === "bucket_hat";
  const rev = analysis.reversible;
  const isNonApparel = !/headwear|tops|outerwear|dresses|bottoms|apparel/.test(analysis.category);
  const productType = analysis.product_type ?? "other_physical_product";

  /* colourways are extracted from the product (analysis.colors); user-provided
     colourways are a fallback only (kept for legacy/QA fixtures). */
  const colorsFromAnalysis = analysis.colors.map((c) => ({
    name: c.name,
    hex: c.hex,
    pantone: c.pantone,
  }));
  const colorsFromInputs = (inputs.colorways ?? []).map((c) => ({
    name: c.name,
    hex: c.code,
    pantone: undefined as string | undefined,
  }));
  const detected = colorsFromAnalysis.length ? colorsFromAnalysis : colorsFromInputs;
  const faceAName = detected[0]?.name ?? "Khaki";
  const faceBName = detected[1]?.name ?? detected[0]?.name ?? "Black";

  const fabricName = analysis.material_indicators.some((m) => /cotton/i.test(m.name))
    ? "100% cotton woven"
    : "Woven fabric (composition TBC)";

  /* ------------------------------ materials ------------------------------ */
  const materials: Material[] = [
    {
      id: "mat-primary",
      name: "Primary material",
      type: "other",
      composition: est("Material grade TBC — confirm with supplier", 0.5, "Composition not specified for this product."),
      color: faceAName,
      notes: "Main structural material for this product.",
    },
    {
      id: "mat-fasteners",
      name: "Fastener hardware",
      type: "hardware",
      composition: est("Fastener set — confirm type and size", 0.5),
      color: "Natural",
      notes: "Confirm against approved sample.",
    },
    {
      id: "mat-finish",
      name: "Surface finish",
      type: "other",
      composition: est("Finish per approved sample", 0.4),
      color: "Per finish spec",
      notes: "Confirm application method with factory.",
    },
  ];

  if (isBucket) {
    materials.length = 0;
    materials.push(
      {
        id: "mat-shell-face-a",
        name: "Outer shell fabric",
        type: "fabric",
        composition: est(fabricName, 0.85, "Composition based on the supplied description."),
        width_cm: est("145", 0.6, "Assumed standard roll width — confirm with supplier."),
        color: faceAName,
        notes: "Face A of the reversible product.",
        supplier: {
          name: "Al-Ahram Textiles Co.",
          material_code: "AAT-COT-DR1",
          country: "Egypt",
          moq: "500 m",
          lead_time_days: "14",
          price: "6.50",
          currency: "EUR",
          certification: "OEKO-TEX Standard 100",
          approval_status: "UNVERIFIED",
        },
      },
      {
        id: "mat-shell-face-b",
        name: "Inner shell fabric",
        type: "fabric",
        composition: est(fabricName, 0.85, "Composition based on the supplied description."),
        width_cm: est("145", 0.6, "Assumed standard roll width — confirm with supplier."),
        color: faceBName,
        notes: rev ? "Face B of the reversible product." : "Lining face.",
      },
      {
        id: "mat-thread",
        name: "Sewing thread",
        type: "trim",
        composition: est("Polyester, Tex 40", 0.65),
        color: "Matching dominant face",
        notes: "Recommended manufacturing baseline — confirm against final fabric.",
      },
      {
        id: "mat-brand-label",
        name: "Brand label",
        type: "trim",
        composition: est("Woven polyester label", 0.6, "Optional — confirm brand requirement."),
        color: inputs.brand_name ?? "Brand",
        notes: "Brand-specific; supplier TBD.",
      },
      {
        id: "mat-care-label",
        name: "Care label",
        type: "trim",
        composition: est("Printed polyester label", 0.6, "If required by market regulation."),
        color: "White",
        notes: "Required for most export markets.",
      }
    );
  }

  /* -------------------------------- BOM ---------------------------------- */
  const bomFaceA = { name: faceAName };
  const bomFaceB = { name: faceBName };
  const bom: TechPack["bom"] = [
    {
      id: "bom-structure",
      position: 1,
      component_name: "Main structure",
      material_name: "Primary material",
      specification: "Material grade TBC — confirm with supplier",
      unit: "pcs",
      consumption: "TBD",
      consumption_is_estimated: true,
      color: faceAName,
      supplier: "TBD",
      notes: "Confirms per approved component list.",
    },
    {
      id: "bom-fasteners",
      position: 2,
      component_name: "Fastener set",
      material_name: "Fastener hardware",
      specification: "Fasteners to product requirement",
      unit: "set",
      consumption: "TBD",
      consumption_is_estimated: true,
      color: "Natural / per variant",
      supplier: "TBD",
      notes: "Confirm type and size per approved sample.",
    },
    {
      id: "bom-finish",
      position: 3,
      component_name: "Surface finish",
      material_name: "Finish medium",
      specification: "Finish per approved sample",
      unit: "ml/m\u00b2",
      consumption: "TBD",
      consumption_is_estimated: true,
      color: "Per finish spec",
      supplier: "TBD",
      notes: "Confirm application method with factory.",
    },
  ];

  if (isBucket) {
    bom.length = 0;
    bom.push(
    ...(isBucket
      ? [
          {
            id: "bom-shell-a",
            position: 1,
            component_name: "Outer shell (Face A)",
            material_name: "Cotton woven fabric",
            specification: fabricName,
            unit: "m",
            consumption: 0.35,
            consumption_is_estimated: true,
            color: bomFaceA.name,
            supplier: "TBD",
            notes: "Cut from pattern/marker. Estimated consumption — confirm against approved marker.",
          },
          {
            id: "bom-shell-b",
            position: 2,
            component_name: rev ? "Inner shell (Face B)" : "Lining / inner shell",
            material_name: "Cotton woven fabric",
            specification: fabricName,
            unit: "m",
            consumption: 0.35,
            consumption_is_estimated: true,
            color: bomFaceB.name,
            supplier: "TBD",
            notes: "Estimated consumption — confirm against approved marker.",
          },
        ]
      : [
          {
            id: "bom-main",
            position: 1,
            component_name: "Main body fabric",
            material_name: "Fabric",
            specification: fabricName,
            unit: "m",
            consumption: "TBD",
            consumption_is_estimated: true,
            color: bomFaceA.name,
            supplier: "TBD",
            notes: "Requires pattern/marker confirmation.",
          },
        ]),
    {
      id: "bom-thread",
      position: isBucket ? 3 : 2,
      component_name: "Sewing thread",
      material_name: "Polyester",
      specification: isBucket ? "Tex 40, matching face" : "Tex 40",
      unit: "m",
      consumption: "TBD",
      consumption_is_estimated: true,
      color: "Matching dominant face",
      supplier: "TBD",
      notes: "Lockstitch usage — confirm with factory estimate.",
    },
    {
      id: "bom-brand-label",
      position: isBucket ? 4 : 3,
      component_name: "Brand label",
      material_name: "Woven label",
      specification: "Polyester woven label",
      unit: "pcs",
      consumption: 1,
      consumption_is_estimated: false,
      color: inputs.brand_name ?? "Brand",
      supplier: "TBD",
      notes: "Optional — confirm placement per brand standard.",
    },
    {
      id: "bom-care-label",
      position: isBucket ? 5 : 4,
      component_name: "Care label",
      material_name: "Printed label",
      specification: "Polyester printed label",
      unit: "pcs",
      consumption: 1,
      consumption_is_estimated: false,
      color: "White",
      supplier: "TBD",
      notes: "If required for target market.",
    }
  );
  }

  /* ----------------------------- measurements ---------------------------- */
  const ms = bucketHatMeasurements(sizes);
  const POM = isBucket
    ? [
        {
          id: "A",
          name: "Head opening circumference",
          how_to_measure:
            "Measure around the finished inside circumference of the hat opening, following the seam line.",
          unit: "cm",
          tolerance: "\u00b10.5 cm",
        },
        {
          id: "B",
          name: "Crown height",
          how_to_measure:
            "Measure from the crown centre to the hat opening edge, along the outer surface.",
          unit: "cm",
          tolerance: "\u00b10.5 cm",
        },
        {
          id: "C",
          name: "Brim width",
          how_to_measure:
            "Measure the brim from the head-opening seam to the outer brim edge, at the front centre.",
          unit: "cm",
          tolerance: "\u00b10.3 cm",
        },
        {
          id: "D",
          name: "Crown width",
          how_to_measure:
            "Measure across the crown at its widest point, over the outer shell.",
          unit: "cm",
          tolerance: "\u00b10.5 cm",
        },
        {
          id: "E",
          name: "Overall height",
          how_to_measure:
            "Measure total height from the top of the crown to the brim outer edge, hat resting on a flat surface.",
          unit: "cm",
          tolerance: "\u00b10.5 cm",
        },
      ]
    : isNonApparel
      ? genericPomFor(productType)
      : [
        {
          id: "M1",
          name: "Main total length (shoulder seam to hem)",
          how_to_measure: "Measure along the garment centre front.",
          unit: "cm",
          tolerance: "\u00b11 cm",
        },
        {
          id: "M2",
          name: "Main width / circumference",
          how_to_measure: "Measure at the widest point of the finished garment.",
          unit: "cm",
          tolerance: "\u00b11 cm",
        },
      ];

/** Generic POM for arbitrary non-apparel products (§73). */
function genericPomFor(productType: string): Array<{
  id: string;
  name: string;
  how_to_measure: string;
  unit: string;
  tolerance: string;
}> {
  if (/bottle|flask|thermos/.test(productType)) {
    return [
      { id: "G1", name: "Overall height", how_to_measure: "Measure total height of the finished bottle, base to cap.", unit: "cm", tolerance: "\u00b10.3 cm" },
      { id: "G2", name: "Body diameter", how_to_measure: "Measure across the widest point of the body.", unit: "cm", tolerance: "\u00b10.3 cm" },
      { id: "G3", name: "Capacity", how_to_measure: "Verified capacity \u2014 fill to mark and measure.", unit: "ml", tolerance: "\u00b12%" },
    ];
  }
  if (/chair|stool|sofa/.test(productType)) {
    return [
      { id: "G1", name: "Total height", how_to_measure: "Floor to highest point of the assembled product.", unit: "cm", tolerance: "\u00b11 cm" },
      { id: "G2", name: "Width", how_to_measure: "Overall width at the widest point.", unit: "cm", tolerance: "\u00b11 cm" },
      { id: "G3", name: "Depth", how_to_measure: "Front-to-back overall depth.", unit: "cm", tolerance: "\u00b11 cm" },
    ];
  }
  return [
    { id: "G1", name: "Overall height", how_to_measure: "Measure the total height of the finished product, resting on a flat surface.", unit: "cm", tolerance: "\u00b10.5 cm" },
    { id: "G2", name: "Overall width", how_to_measure: "Measure the widest point across the finished product.", unit: "cm", tolerance: "\u00b10.5 cm" },
    { id: "G3", name: "Overall depth", how_to_measure: "Measure front-to-back at the deepest point.", unit: "cm", tolerance: "\u00b10.5 cm" },
  ];
}

  const measurements = POM.map((p) => {
    const values: Record<string, number> = {};
    for (const v of ms.head) {
      if (p.id === "A") values[v.s] = v.head;
      if (p.id === "B") values[v.s] = v.crown;
      if (p.id === "C") values[v.s] = v.brim;
      if (p.id === "D") values[v.s] = v.cw;
      if (p.id === "E") values[v.s] = v.crown;
      if (p.id === "M1") values[v.s] =
        { XS: 44, S: 46, M: 48, L: 50, XL: 52, XXL: 54 }[v.s] ?? 48;
      if (p.id === "M2") values[v.s] =
        { XS: 76, S: 80, M: 84, L: 88, XL: 92, XXL: 96 }[v.s] ?? 84;
      if (p.id === "G1") values[v.s] =
        { XS: 16, S: 17, M: 18, L: 19, XL: 20, XXL: 21 }[v.s] ?? 18;
      if (p.id === "G2") values[v.s] =
        { XS: 20, S: 21, M: 22, L: 23, XL: 24, XXL: 25 }[v.s] ?? 22;
      if (p.id === "G3" && isNonApparel) values[v.s] =
        { XS: 25, S: 26, M: 27, L: 28, XL: 29, XXL: 30 }[v.s] ?? 27;
    }
    return {
      ...p,
      values,
      source: "inferred" as const,
      confidence: 0.72,
      requires_review: true,
    };
  });

  /* ----------------------------- construction ---------------------------- */
  const construction: TechPack["construction"] = isBucket
    ? [
        {
          section: "General construction",
          items: [
            rev
              ? "Construct as a fully reversible two-layer bucket hat."
              : "Construct as a single-layer bucket hat.",
            "Maintain consistent seam allowance throughout production.",
            "All seams must be clean and securely finished.",
            "Avoid exposed raw edges on the finished product.",
            "Press seams before topstitching.",
          ],
        },
        {
          section: "Crown",
          items: [
            "Join crown panels using lockstitch construction.",
            "Maintain smooth crown curvature.",
            "Match opposing layers accurately when pairing faces.",
          ],
        },
        {
          section: "Brim",
          items: [
            "Construct brim using two fabric layers.",
            "Maintain consistent brim width around the circumference.",
            "Secure brim layers using even topstitching.",
          ],
        },
        ...(rev
          ? [
              {
                section: "Reversible construction",
                items: [
                  "Outer and inner faces must be cleanly joined.",
                  "No exposed raw seam allowances on either wearing side.",
                  "Ensure the colourway remains visually clean when reversed.",
                  "Clean-finish all seams hidden inside the completed layer structure.",
                ],
              },
            ]
          : []),
      ]
    : isNonApparel
      ? [
          {
            section: "Sub-assembly",
            items: [
              "Prepare all parts per component list before final assembly.",
              "Inspect mating surfaces and interfaces for fit prior to assembly.",
            ],
          },
          {
            section: "Final assembly",
            items: [
              "Assemble main body and sub-assemblies per the approved drawing.",
              "Fit and secure all fasteners to the declared torque/settings.",
              "Final visual check: alignment, finish, cleanliness.",
            ],
          },
          {
            section: "Finish",
            items: [
              "Apply finishing process per the finish specification.",
              "Pack per packaging specification. Quantity and fill per carton: TBD.",
            ],
          },
        ]
      : [
        {
          section: "General construction",
          items: [
            "Standard cut-and-sew construction.",
            "Consistent seam allowance throughout.",
            "Clean seam finishes on all exposed edges.",
          ],
        },
      ];

  /* ------------------------------ colorways ------------------------------ */
  const colorways: Colorway[] = (detected.length ? detected : [{ name: "Khaki", hex: "#C3B091", pantone: undefined }]).map((c, i) => {
    const pair = rev && detected.length > 1 ? detected[(i + 1) % detected.length] : c;
    return {
      id: `cw-${i + 1}`,
      number: i + 1,
      name: c.name.toUpperCase(),
      code: c.hex,
      pantone: c.pantone,
      face_a: c.name,
      face_b: rev && detected.length > 1 ? pair.name : undefined,
      threading: "Matching dominant face",
      hardware: "None",
      labels: "Brand label + care label",
      reversible: rev,
      notes:
        rev && detected.length > 1
          ? "Reversible combination of the two colourways."
          : "Extracted from product image/description.",
    };
  });

  /* ------------------------------- labels -------------------------------- */
  const labels: Label[] = isBucket
    ? [
        {
          id: "lbl-brand",
          name: "Brand label",
          type: "Woven (polyester)",
          content: inputs.brand_name ? `Brand: ${inputs.brand_name}` : "Brand mark",
          placement: "Inside crown, at back seam",
          required: false,
          notes: "Proposed placement — confirm with brand standard.",
        },
        {
          id: "lbl-care",
          name: "Care label",
          type: "Printed (polyester)",
          content: "Care instructions, fibre composition, fibre origin (if required)",
          placement: "Inside seam near crown edge",
          required: false,
          notes: "Confirm content against target market regulations.",
        },
      ]
    : [];

  /* ------------------------------ QC / packing --------------------------- */
  const qcBase: TechPack["quality_control"] = [
    { id: "qc-f1", category: "Fabric", check: "Fabric shade matches approved standard", method: "Visual + approved shade set" },
    { id: "qc-f2", category: "Fabric", check: "Fabric weight within tolerance", method: "GSM check on inspected rolls" },
    { id: "qc-f3", category: "Fabric", check: "No visible weaving or printing defects", method: "Inspection table light" },
    { id: "qc-f4", category: "Fabric", check: "No stains, holes or pulls", method: "Inspection" },
    { id: "qc-s1", category: "Sewing", check: "Stitch density consistent", standard: "10\u201312 SPI" },
    { id: "qc-s2", category: "Sewing", check: "No skipped stitches", method: "Visual inspection" },
    { id: "qc-s3", category: "Sewing", check: "No loose / unfinished thread ends", method: "Visual inspection" },
    { id: "qc-s4", category: "Sewing", check: "Seam allowance consistent", method: "Ruler check on sample pieces" },
    { id: "qc-d1", category: "Dimensions", check: "Head opening within tolerance", standard: "\u00b10.5 cm" },
    { id: "qc-d2", category: "Dimensions", check: "Crown height within tolerance", standard: "\u00b10.5 cm" },
    { id: "qc-d3", category: "Dimensions", check: "Brim width within tolerance", standard: "\u00b10.3 cm" },
  ];
  const genericQC: TechPack["quality_control"] = [
    { id: "qc-a1", category: "Assembly", check: "All joints and connections are secure and within declared tolerance", method: "Functional check + torque/force check per requirement" },
    { id: "qc-a2", category: "Assembly", check: "No loose, missing or damaged parts", method: "Visual inspection per component list" },
    { id: "qc-d1", category: "Dimensions", check: "Overall dimensions within declared tolerance", standard: "\u00b10.5 cm" },
    { id: "qc-d2", category: "Dimensions", check: "Finished weight within declared range", method: "Calibrated scale" },
    { id: "qc-f1", category: "Function", check: "Primary function operates correctly", method: "Functional test per function specification" },
    { id: "qc-f2", category: "Function", check: "All moving parts operate without obstruction", method: "Cyclic functional test" },
    { id: "qc-p1", category: "Packaging", check: "Packed per packaging specification", method: "Visual inspection of finished pack" },
  ];
  const qualityControl = isNonApparel
    ? genericQC
    : rev
      ? [
          ...qcBase,
          { id: "qc-r1", category: "Reversible finish", check: "No exposed raw edges on either face", method: "Turn sample inside out, inspect all seams" },
          { id: "qc-r2", category: "Reversible finish", check: "Both faces clean and finish-consistent", method: "Visual inspection" },
          { id: "qc-r3", category: "Reversible finish", check: "Colour layers correctly matched", method: "Compare face A/B alignment" },
        ]
      : qcBase;

  const packaging: TechPack["packaging"] = isNonApparel
    ? [
        {
          id: "pkg-1",
          item: "Unit packaging",
          spec: "Protective packing per unit, per approved pack standard",
          unit: "pcs",
          quantity: 1,
          notes: "Confirm pack standard and protective inserts.",
        },
        {
          id: "pkg-2",
          item: "Export carton",
          spec: "Standard export carton, padded/partitioned packing",
          unit: "pcs",
          quantity: "TBD",
          notes: "Carton size and pack quantity depend on final packing method.",
        },
      ]
    : [
        {
          id: "pkg-1",
          item: "Polybag",
          spec: "Clear LDPE polybag, single hat per bag",
          unit: "pcs",
          quantity: 1,
          notes: "Final packaging to match shipping cost-rate requirements.",
        },
        {
          id: "pkg-2",
          item: "Export carton",
          spec: "Standard export carton, layered packing",
          unit: "pcs",
          quantity: "TBD",
          notes: "Carton size and pack quantity depend on final packing method.",
        },
      ];

  /* ----------------------------- assumptions ----------------------------- */
  const assumptions: TechPack["assumptions"] = [
    {
      id: "as-1",
      statement: "Fabric composition assumed to be woven cotton based on the supplied description.",
      category: "materials",
      confidence: 0.85,
      impact: "Cloth sourcing, washing behaviour, cost",
      required_action: "Confirm yarn/fibre composition with supplier.",
    },
    {
      id: "as-2",
      statement: "Measurements are proposed starting specifications and must be validated against the approved pattern and sample.",
      category: "measurements",
      confidence: 0.7,
      impact: "Fit, grading",
      required_action: "Technical review of sample garment.",
    },
    {
      id: "as-3",
      statement: "No hardware is assumed because none is visible or specified.",
      category: "components",
      confidence: 0.8,
      impact: "None for the base product",
      required_action: "Ship with confirmation of final design intent.",
    },
    {
      id: "as-4",
      statement: "Thread specification is a recommended manufacturing baseline, not a verified spec.",
      category: "materials",
      confidence: 0.65,
      impact: "Seam strength, appearance",
      required_action: "Confirm with factory technical team.",
    },
    {
      id: "as-5",
      statement: "Fabric consumption is estimated and requires marker validation.",
      category: "bom",
      confidence: 0.6,
      impact: "Costing, ordering quantity",
      required_action: "Run the approved marker and confirm consumption.",
    },
    inputs.quantity
      ? {
          id: "as-6",
          statement: `Production quantity assumed to be ${inputs.quantity} units for costing context.`,
          category: "commercial",
          confidence: 0.95,
          impact: "Ordering, MOQ compliance",
          required_action: "Confirm the final order quantity.",
        }
      : {
          id: "as-6",
          statement: "Production quantity not specified; treated as unknown for costing.",
          category: "commercial",
          confidence: 0.95,
          impact: "Ordering, MOQ compliance",
          required_action: "Supply target order quantity.",
        },
  ];

  const stitchSpec: TechPack["stitching"] = isBucket
    ? {
        primary_stitch: "Lockstitch",
        spi_min: 10,
        spi_max: 12,
        spi_text: "10\u201312 SPI",
        seam_allowance_cm: 1,
        seam_allowance_text: "1 cm",
        topstitch: "3 mm from edge",
        thread: "Polyester, matching face fabric",
        needle: "Recommended needle size based on final fabric GSM",
        source: "inferred",
        confidence: 0.68,
        requires_review: true,
      }
    : {
        primary_stitch: "Lockstitch",
        spi_text: "Recommended per fabric weight",
        seam_allowance_text: "1 cm",
        source: "inferred",
        confidence: 0.6,
        requires_review: true,
      };

  const prefix = isBucket ? "HAT" : "GAR";
  return {
    version: "V1.0",
    generated_at: now,
    review_status: "REVIEW_REQUIRED",
    product: {
      name: inputs.name || "Untitled Product",
      code: `${prefix}-001`,
      category: analysis.category,
      product_type: analysis.product_type,
      description: inputs.description,
      intended_use: isBucket ? "Everyday casual wear" : undefined,
      target_customer: inputs.intended_customer || "Casual wear consumer",
      season: undefined,
      collection: undefined,
      quantity: inputs.quantity,
      brand: inputs.brand_name,
      revision: "V1.0",
      notes: inputs.notes,
    },
    materials,
    bom,
    measurements,
    construction,
    stitching: stitchSpec,
    colorways,
    labels,
    quality_control: qualityControl,
    packaging,
    assumptions,
    warnings: [],
  };
}
