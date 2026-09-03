import type { CommercialInputs, ProductAnalysis } from "../pipeline-types";
import { nearestPantone } from "@/lib/colorways/pantone";

/**
 * Mock provider: a deterministic, offline heuristic engine used when no AI
 * API key is configured. It implements the exact same three stages as a real
 * model (vision analysis -> manufacturing inference -> tech pack), so the
 * whole product loop works in a demo with zero keys.
 *
 * All output values are explicitly tagged "inferred" / "assumed" with
 * confidence below 1.0 — same provenance discipline enforced on LLM output.
 */

/** Named colour lexicon used by the mock vision stage to extract colorways
 *  from a product description (the mock has no real vision capability). */
const COLOR_LEXICON: Array<[RegExp, string, string]> = [
  [/khaki/i, "Khaki", "#C3B091"],
  [/black\b/i, "Black", "#111111"],
  [/olive/i, "Olive", "#6B8E23"],
  [/ecru/i, "Ecru", "#C8AD7F"],
  [/natural/i, "Natural", "#D9CDB2"],
  [/navy/i, "Navy", "#1F2A44"],
  [/beige/i, "Beige", "#D5C8AA"],
  [/cream/i, "Cream", "#F3E5C8"],
  [/white\b/i, "White", "#F4F4F1"],
  [/grey|gray/i, "Grey", "#808080"],
  [/charcoal/i, "Charcoal", "#36454F"],
  [/burgundy/i, "Burgundy", "#63322F"],
  [/red\b/i, "Red", "#9E2D46"],
  [/blue\b/i, "Blue", "#2A3356"],
  [/green\b/i, "Green", "#3E4B3D"],
  [/brown/i, "Brown", "#4F3B33"],
  [/yellow|mustard/i, "Mustard", "#A36D28"],
  [/sand/i, "Sand", "#C2A878"],
  [/rust/i, "Rust", "#B55C3E"],
];

export function extractColorsFromDescription(
  description: string,
  fallback: Array<{ name: string; code?: string }> = []
) {
  const found: Array<{ name: string; hex: string }> = [];
  const seen = new Set<string>();
  for (const [re, name, hex] of COLOR_LEXICON) {
    if (re.test(description) && !seen.has(name)) {
      seen.add(name);
      found.push({ name, hex });
    }
  }
  if (found.length === 0 && fallback.length > 0) {
    for (const c of fallback) found.push({ name: c.name, hex: c.code ?? "#808080" });
  }
  if (found.length === 0) found.push({ name: "Khaki", hex: "#C3B091" });
  return found.slice(0, 6).map((c, i) => ({
    name: c.name,
    hex: c.hex,
    pantone: nearestPantone(c.hex).code,
    dominance: Math.max(8, Math.round(80 - i * 22)),
    role: i === 0 ? "Face A" : i === 1 ? "Face B" : "Accent colour",
  }));
}

const is = (s: string) => s.toLowerCase();

export function detectProductType(description: string): { product_type: string; category: string } {
  const d = is(description);
  const rules: Array<[RegExp, { type: string; cat: string }]> = [
    [/bucket hat|bucket/i, { type: "bucket_hat", cat: "headwear" }],
    [/\bhat\b/, { type: "hat", cat: "headwear" }],
    [/beanie|(?<!screw )(?<!bottle )(?<!flask )(?<!fuel )(?<!marker )(?<!spray )\bcap\b/, { type: "cap", cat: "headwear" }],
    [/t[- ]?shirt|\btee\b/, { type: "t_shirt", cat: "tops" }],
    [/hoodie|sweatshirt/, { type: "hoodie", cat: "tops" }],
    [/sweater|jumper|knitwear/, { type: "sweater", cat: "tops" }],
    [/jacket|parka|coat/, { type: "jacket", cat: "outerwear" }],
    [/dress/, { type: "dress", cat: "dresses" }],
    [/trousers|pants|jeans/, { type: "trousers", cat: "bottoms" }],
    [/shorts?/, { type: "shorts", cat: "bottoms" }],
    [/shirt/, { type: "shirt", cat: "tops" }],
    [/skirt/, { type: "skirt", cat: "bottoms" }],
    [/running shoe|sneaker|shoe|trainer|boot/, { type: "shoe", cat: "footwear" }],
    [/backpack|bag|tote|pouch|wallet|handbag|shoulder bag|briefcase/, { type: "bag", cat: "bags" }],
    [/chair|\bstool\b|\bsofa\b|\btable(?!\s*lamp)|\bdesk(?!\s*lamp)|\bshelf\b|\bfurniture\b|\bdresser\b/, { type: "chair", cat: "furniture" }],
    [/bottle|flask|canteen|thermos|mug|cup/, { type: "bottle", cat: "homeware" }],
    [/lamp|light|lighting|lantern/, { type: "lamp", cat: "lighting" }],
    [/box|crate|parcel|carton|cardboard/, { type: "box", cat: "packaging" }],
    [/bracket|bracket mount|mount|hinge|plate/, { type: "bracket", cat: "industrial components" }],
    [/phone case|case(?!making)|cover for/, { type: "phone_case", cat: "accessories" }],
    [/battery|charger|power bank|speaker|headphone|electronics|device|pcb/, { type: "electronics", cat: "electronics" }],
    [/toy|doll|puzzle|game/, { type: "toy", cat: "toys" }],
    [/bracelet|necklace|earring|ring|jewelry|jewellery/, { type: "jewelry", cat: "jewelry" }],
  ];
  for (const [re, r] of rules) if (re.test(d)) return { product_type: r.type, category: r.cat };
  return { product_type: "other_physical_product", category: "other-physical-product" };
}

const headCir = (s: string): number => {
  const base: Record<string, number> = { XS: 54, S: 56, M: 58, L: 60, XL: 62, XXL: 64 };
  if (base[s]) return base[s];
  if (/^\d+$/.test(s)) return Math.min(70, Math.max(50, parseInt(s, 10)));
  return 58;
};

/** Universal component maps for non-apparel product families (§73 test cases). */
function genericComponentsFor(
  product_type: string,
  category: string
): NonNullable<ProductAnalysis["components"]> {
  const f = (
    id: string,
    name: string,
    function_: string,
    extra: Partial<ProductAnalysis["components"][number]> = {}
  ): ProductAnalysis["components"][number] => ({ id, name, count: 1, function: function_, source: "inferred", confidence: 0.8, ...extra });
  if (category === "bags") {
    return [f("comp-main", "Main body", "Primary body of the bag"), f("comp-handle", "Handle", "Carrying handle"), f("comp-closure", "Closure", "Opening and closing mechanism")];
  }
  if (/chair|stool|sofa/.test(product_type + category)) {
    return [f("comp-frame", "Frame", "Structural frame of the product"), f("comp-seat", "Seat", "Seating surface")];
  }
  if (/bottle|flask|thermos/.test(product_type + category)) {
    return [f("comp-body", "Bottle body", "Fluid-holding body"), f("comp-cap", "Cap", "Sealing cap of the container")];
  }
  if (/lamp|lantern/.test(product_type + category)) {
    return [f("comp-lamp", "Lamp housing", "Enclosure holding the light source")];
  }
  if (/box|crate|carton/.test(product_type + category)) {
    return [f("comp-box", "Box body", "Packaging container"), f("comp-flap", "Foldable panel", "Folding panel forming the closure")];
  }
  if (/bracket|mount|plate/.test(product_type + category)) {
    return [f("comp-plate", "Mounting plate", "Load-bearing interface plate")];
  }
  if (/shoe|sneaker|boot|trainer/.test(product_type + category)) {
    return [f("comp-upper", "Upper", "Upper of the shoe"), f("comp-sole", "Outsole", "Ground-contact sole layer")];
  }
  if (/case/.test(product_type)) {
    return [f("comp-housing", "Case housing", "Protective housing")];
  }
  return [
    { id: "comp-main", name: "Main body", count: 1, function: "Primary physical body of the product", source: "inferred", confidence: 0.8 },
  ];
}

export function bucketHatMeasurements(sizes: string[]) {
  const crown = (s: string) => {
    const m: Record<string, number> = { XS: 9, S: 9.5, M: 10, L: 10.5, XL: 11, XXL: 11.5 };
    return m[s] ?? 10;
  };
  const brim = (s: string) => {
    const m: Record<string, number> = { XS: 6, S: 6.5, M: 7, L: 7.5, XL: 8, XXL: 8.5 };
    return m[s] ?? 7;
  };
  const cw = (s: string) => {
    const m: Record<string, number> = { XS: 16, S: 17, M: 18, L: 19, XL: 20, XXL: 21 };
    return m[s] ?? 18;
  };
  const vals = sizes.map((s) => ({ s, head: headCir(s), crown: crown(s), brim: brim(s), cw: cw(s) }));
  return {
    head: vals,
    crown: vals,
    brim: vals,
    cw: vals,
  };
}

export function analyzeMock(description: string, inputs: CommercialInputs): ProductAnalysis {
  const { product_type, category } = detectProductType(description);
  const reversible = /revers/i.test(description);
  const d = description.toLowerCase();
  const isBucket = product_type === "bucket_hat";

  const material_indicators: ProductAnalysis["material_indicators"] = [];
  if (/cotton/.test(d)) {
    material_indicators.push({
      name: "Cotton (woven)",
      type: "fabric",
      source: "inferred",
      confidence: 0.82,
      notes: "Fabric type inferred from the supplied description.",
    });
  } else if (/linen/.test(d)) {
    material_indicators.push({ name: "Linen", type: "fabric", source: "inferred", confidence: 0.7 });
  } else if (/polyester/.test(d)) {
    material_indicators.push({ name: "Polyester", type: "fabric", source: "inferred", confidence: 0.7 });
  } else {
    material_indicators.push({
      name: "Woven fabric (unknown composition)",
      type: "fabric",
      source: "assumed",
      confidence: 0.45,
      notes: "Composition not specified in the input.",
    });
  }
  material_indicators.push({
    name: "Sewing thread (polyester)",
    type: "trim",
    source: "assumed",
    confidence: 0.6,
    notes: "Standard for woven apparel; recommended baseline.",
  });

  const components: ProductAnalysis["components"] = [];
  if (isBucket) {
    components.push(
      { id: "comp-crown", name: "Crown panels", count: 5, function: "Fitted crown of the hat", source: "inferred", confidence: 0.9 },
      { id: "comp-brim", name: "Brim", count: 1, function: "Dropped brim band, two layers", source: "inferred", confidence: 0.9 },
      { id: "comp-seams", name: "Panelled seams", count: 5, function: "Crown panel joins", source: "inferred", confidence: 0.85 }
    );
    if (reversible) {
      components.push({
        id: "comp-innershell",
        name: "Inner lining face",
        count: 1,
        function: "Reverse-side shell layer (second face)",
        source: "inferred",
        confidence: 0.85,
      });
    }
  } else {
    components.push(...genericComponentsFor(product_type, category));
  }

  /* ---- colour extraction (image-observed in production; lexicon here) ---- */
  const colors = extractColorsFromDescription(inputs.description, inputs.colorways ?? []);

  const confidence =
    isBucket && reversible
      ? { overall: 0.68, product_type: 0.95, construction: 0.8, materials: 0.55 }
      : { overall: 0.6, product_type: 0.9, construction: 0.7, materials: 0.5 };

  return {
    product_type,
    category,
    silhouette: isBucket
      ? "Soft crown with a wide, down-dropped brim; classic bucket silhouette."
      : "Generic observed silhouette; specialised analysis unavailable.",
    reversible,
    construction: isBucket
      ? reversible
        ? "Panelled bucket hat, constructed as a fully reversible two-layer product."
        : "Panelled bucket hat, single-layer construction."
      : "Basic cut-and-sew construction.",
    components,
    material_indicators,
    seam_indicators: ["Panelled seam joins"],
    hardware: [],
    features: [],
    label_observations: [],
    colors,
    observable_details: [],
    missing_from_image: [
      "Exact fabric composition",
      "Fabric GSM",
      "Label placement",
      "Seam finish details",
    ],
    visual_notes:
      inputs.demoMode === true
        ? "Offline demo mode: analysis is driven by the description and input metadata only. Configure an API key for full image analysis."
        : undefined,
    confidence,
  };
}
