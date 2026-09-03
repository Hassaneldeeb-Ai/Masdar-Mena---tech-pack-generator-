import type { Material, TechPack } from "@/lib/schemas/tech-pack";

/**
 * Deterministic technical illustrations, generated from the spec itself.
 * No AI art — these are computed drawings that always reflect the pack:
 *  - front/back flat sketches with dimension callouts
 *  - construction guides with numbered zones
 *  - material swatches per type (fabric / thread / label / hardware)
 *  - size-chart overview bars per POM
 */

const INK = "#232b32";
const INK_SOFT = "#5c6670";
const GUIDE = "#c9c6d4";
const PAPER = "#f5f4f7";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Wrap an SVG string as an img-friendly data URL (renders in browsers). */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** The SVG-to-PDF path needs rasterization; browsers accept SVG directly. */
export function illustrationUrl(kind: string, pack: TechPack, sizes?: string[], material?: Material): string {
  switch (kind) {
    case "front":
      return svgDataUrl(buildFrontSketchSvg(pack));
    case "back":
      return svgDataUrl(buildBackSketchSvg(pack));
    case "guide":
      return svgDataUrl(buildConstructionGuideSvg(pack, "front"));
    case "chart":
      return svgDataUrl(buildSizeChartSvg(pack, sizes ?? []));
    case "swatch":
      return svgDataUrl(buildMaterialSwatchSvg(material ?? pack.materials[0]));
    default:
      return "";
  }
}

function css(hex: string): string {
  return /^#([0-9a-f]{6})$/i.test(hex) ? hex : "#d8d4dc";
}

function shade(hex: string, amt: number): string {
  const m = rgb(hex);
  if (!m) return "#d8d4dc";
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => f(v).toString(16).padStart(2, "0");
  return `#${toHex(m.r * amt)}${toHex(m.g * amt)}${toHex(m.b * amt)}`;
}

function rgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Pick the first declared colourway code for fill tints. */
function shellTint(pack: TechPack): string {
  const code = pack.colorways[0]?.code;
  return code ? css(code) : "#d8d4dc";
}

/** Front-view silhouette: bucket hat (default), garment, or bag, scaled 500x340. */
function silhouetteFront(pack: TechPack): { body: string; zones: Array<{ x: number; y: number; r: number }> } {
  const kind = `${pack.product.product_type} ${pack.product.category}`.toLowerCase();
  const fill = shellTint(pack);
  const dark = shade(fill, 0.82);
  let body: string;
  let zones: Array<{ x: number; y: number; r: number }>;

  if (/hat|cap|headwear/.test(kind)) {
    // Bucket hat front view — 5-panel crown, rounded crown crown, straight sidewall, wide brim
    const c = "#232b32";
    body = `
      <!-- crown dome -->
      <path d="M170,132 C170,84 210,60 250,60 C290,60 330,84 330,132 C330,170 312,198 288,206 L212,206 C188,198 170,170 170,132 Z" fill="${fill}" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/>
      <!-- crown seam lines (panel construction) -->
      <path d="M250,62 C244,110 244,170 247,204" fill="none" stroke="${dark}" stroke-width="1.1" stroke-dasharray="4 3" opacity="0.8"/>
      <path d="M206,80 C214,120 216,162 214,202" fill="none" stroke="${dark}" stroke-width="1.1" stroke-dasharray="4 3" opacity="0.8"/>
      <path d="M294,80 C286,120 284,162 286,202" fill="none" stroke="${dark}" stroke-width="1.1" stroke-dasharray="4 3" opacity="0.8"/>
      <!-- seam allowance / turned edge under crown -->
      <path d="M206,132 C250,148 294,132 265,120" fill="none" stroke="${c}" stroke-width="1" opacity="0.45"/>
      <!-- stitched seam from crown to sidewall -->
      <path d="M163,142 C186,152 190,182 199,204" fill="none" stroke="${c}" stroke-width="1.2" opacity="0.6"/>
      <path d="M337,142 C314,152 310,182 301,204" fill="none" stroke="${c}" stroke-width="1.2" opacity="0.6"/>
      <!-- sidewall -->
      <path d="M160,210 C200,222 300,222 340,210 L340,252 L160,252 Z" fill="${fill}" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/>
      <!-- topstitch line near hem of crown -->
      <path d="M167,214 C205,226 295,226 333,214" fill="none" stroke="${dark}" stroke-width="1.2" stroke-dasharray="5 3"/>
      <!-- brim — slightly curved with wavy outer edge -->
      <path d="M158,254 L342,254 C352,286 332,306 300,308 L200,308 C168,306 148,286 158,254 Z" fill="${fill}" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/>
      <!-- brim topstitching (double row) -->
      <path d="M172,262 C200,272 300,272 328,262" fill="none" stroke="${dark}" stroke-width="1.1" stroke-dasharray="4 3"/>
      <path d="M182,286 C210,294 290,294 318,286" fill="none" stroke="${dark}" stroke-width="1.1" stroke-dasharray="4 3"/>
      <!-- underside shadow hint -->
      <path d="M162,256 C200,264 300,264 338,256" fill="none" stroke="${c}" stroke-width="1" opacity="0.35"/>`;
    zones = [
      { x: 250, y: 128, r: 15 }, // crown
      { x: 250, y: 232, r: 15 }, // sidewall
      { x: 172, y: 284, r: 14 }, // brim
    ];
  } else if (/tote|bag|backpack|pack/.test(kind)) {
    body = `
      <path d="M118,138 L382,138 L364,302 L136,302 Z" fill="${fill}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      <!-- side seams -->
      <line x1="120" y1="140" x2="140" y2="298" stroke="${shade(fill, 0.85)}" stroke-width="1"/>
      <line x1="380" y1="140" x2="360" y2="298" stroke="${shade(fill, 0.85)}" stroke-width="1"/>
      <!-- top opening / binding -->
      <path d="M118,138 L382,138" stroke="${INK}" stroke-width="3"/>
      <path d="M122,148 L378,148" stroke="${shade(fill, 0.85)}" stroke-width="1.2" stroke-dasharray="4 3"/>
      <!-- handle, double-layer -->
      <path d="M196,138 C196,84 250,72 250,72 C250,72 304,84 304,138" fill="none" stroke="${INK}" stroke-width="2.4"/>
      <path d="M196,138 C196,84 250,72 250,72 C250,72 304,84 304,138" fill="none" stroke="${shade(fill, 0.85)}" stroke-width="1.1" stroke-dasharray="6 4"/>
      <!-- centre seam -->
      <line x1="250" y1="108" x2="250" y2="292" stroke="${INK}" stroke-width="0.9" stroke-dasharray="4 4"/>
      <!-- bottom gusset stitching -->
      <path d="M140,290 L360,290" stroke="${INK}" stroke-width="1.2" stroke-dasharray="5 3"/>`;
    zones = [
      { x: 250, y: 104, r: 14 }, // handle
      { x: 250, y: 230, r: 16 }, // body
      { x: 168, y: 292, r: 12 }, // bottom seam
    ];
  } else {
    // Generic short-sleeve garment
    body = `
      <path d="M150,104 C150,104 96,80 78,132 C62,180 84,204 116,208 L120,296 L270,296 L274,208 C306,204 328,180 312,132 C294,80 240,104 240,104 C224,116 166,116 150,104 Z" fill="${fill}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      <!-- shoulder seam -->
      <path d="M196,116 C200,180 198,240 196,288 M254,116 C250,180 252,240 254,288" stroke="${shade(fill, 0.85)}" stroke-width="1.1" stroke-dasharray="5 4"/>
      <!-- sleeve seam dots -->
      <path d="M116,208 C150,204 190,204 196,208" fill="none" stroke="${INK}" stroke-width="1" opacity="0.5"/>`;
    zones = [
      { x: 202, y: 150, r: 15 }, // neckline
      { x: 195, y: 250, r: 16 }, // front panel
      { x: 120, y: 200, r: 12 }, // sleeve seam
    ];
  }
  return { body, zones };
}

/** Front flat sketch with dimension lines derived from measurements. */
export function buildFrontSketchSvg(pack: TechPack): string {
  const { body, zones } = silhouetteFront(pack);
  const dims = frontDims(pack);
  return sketchDoc("FRONT — FLAT SKETCH", 700, 420, [
    `<circle cx="${250 - 62}" cy="150" r="80" fill="none" stroke="${GUIDE}" stroke-width="0.8" stroke-dasharray="4 6"/>`,
    `<line x1="60" y1="316" x2="60" y2="96" stroke="${INK_SOFT}" stroke-width="1.3"/>`,
    `<line x1="52" y1="96" x2="68" y2="96" stroke="${INK_SOFT}" stroke-width="1.3"/>`,
    `<line x1="52" y1="316" x2="68" y2="316" stroke="${INK_SOFT}" stroke-width="1.3"/>`,
    `<text x="50" y="210" text-anchor="middle" transform="rotate(-90 50 210)" font-family="monospace" font-size="12" fill="${INK}">${esc(dims.crown)}</text>`,
    `<line x1="96" y1="368" x2="404" y2="368" stroke="${INK_SOFT}" stroke-width="1.3"/>`,
    `<line x1="96" y1="362" x2="96" y2="374" stroke="${INK_SOFT}" stroke-width="1.3"/>`,
    `<line x1="404" y1="362" x2="404" y2="374" stroke="${INK_SOFT}" stroke-width="1.3"/>`,
    `<text x="250" y="392" text-anchor="middle" font-family="monospace" font-size="12" fill="${INK}">${esc(dims.brim)}</text>`,
    `<circle cx="${zones[0].x + zones[0].r / 2}" cy="${zones[0].y - zones[0].r}" r="9" fill="${INK}"/>
     <text x="${zones[0].x + zones[0].r / 2}" y="${zones[0].y - zones[0].r + 3.5}" text-anchor="middle" font-family="monospace" font-size="9" fill="#fff">1</text>`,
    `<text x="${zones[1].x + 18}" y="${zones[1].y + 4}" font-family="monospace" font-size="11" fill="${INK_SOFT}">${esc(dims.head)}</text>`,
    `<text x="${zones[2].x - 14}" y="${zones[2].y - 10}" font-family="monospace" font-size="11" fill="${INK_SOFT}" text-anchor="end">brim</text>`,
    body,
    `<text x="16" y="404" font-family="monospace" font-size="10" fill="${INK_SOFT}">A — POM zones · dimensions in cm · scale approx.</text>`,
  ]);
}

/** Back view: same silhouette, reversed, with reversible-fold annotation. */
export function buildBackSketchSvg(pack: TechPack): string {
  const { body } = silhouetteFront(pack);
  const rev = pack.colorways.some((c) => c.face_b);
  const dims = frontDims(pack);
  return sketchDoc("BACK — FLAT SKETCH", 700, 420, [
    `{{FLIP}}`,
    `<line x1="60" y1="316" x2="60" y2="96" stroke="${INK_SOFT}" stroke-width="1.3"/>
     <text x="50" y="210" text-anchor="middle" transform="rotate(-90 50 210)" font-family="monospace" font-size="12" fill="${INK}">${esc(dims.crown)}</text>`,
    `<line x1="250" y1="96" x2="250" y2="316" stroke="${INK}" stroke-width="1" stroke-dasharray="6 4"/>`,
    `<text x="262" y="116" font-family="monospace" font-size="11" fill="${INK}">centre seam</text>`,
    rev
      ? `<rect x="252" y="330" width="182" height="24" fill="none" stroke="${INK}" stroke-width="1.2"/>
         <text x="343" y="346" text-anchor="middle" font-family="monospace" font-size="10" fill="${INK}">REVERSIBLE — FACE B</text>`
      : `<text x="250" y="392" text-anchor="middle" font-family="monospace" font-size="10" fill="${INK_SOFT}">single layer</text>`,
    body,
    `<text x="16" y="404" font-family="monospace" font-size="10" fill="${INK_SOFT}">inner face · seam allowance per construction notes</text>`,
  ]).replace("{{FLIP}}", `<g transform="translate(500,0) scale(-1,1)" opacity="0.45">${body}</g>`);
}

function frontDims(pack: TechPack): { crown: string; brim: string; head: string } {
  const firstVal = (name: string): string | undefined => {
    const rec =
      pack.measurements.find((m) => m.name.toLowerCase().includes(name)) ??
      pack.measurements.find((m) => m.how_to_measure.toLowerCase().includes(name));
    const key = Object.keys(rec?.values ?? {})[0];
    return key && rec ? String(rec.values[key]) : undefined;
  };
  return {
    crown: `crown ${firstVal("crown") ?? "—"} cm`,
    brim: `brim width ${firstVal("brim") ?? "—"} cm`,
    head: headHint(pack),
  };
}

function headHint(pack: TechPack): string {
  const rec =
    pack.measurements.find((m) => /head opening|head circumference/.test(m.name.toLowerCase())) ??
    pack.measurements.find((m) => /head/.test(m.how_to_measure.toLowerCase()));
  if (!rec) return "head opening";
  const key = Object.keys(rec.values)[0];
  return key ? `head ${String(rec.values[key])} cm` : "head opening";
}

function sketchDoc(title: string, w: number, h: number, parts: string[]): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<rect width="${w}" height="${h}" fill="#ffffff"/>`,
    `<text x="16" y="24" font-family="monospace" font-weight="bold" font-size="13" fill="${INK}">${esc(title)}</text>`,
    `<line x1="16" y1="32" x2="${w - 16}" y2="32" stroke="${INK}" stroke-width="1"/>`,
    ...parts,
    `</svg>`,
  ].join("\n");
}

/** Construction guide: silhouette + numbered callouts tied to construction items. */
export function buildConstructionGuideSvg(pack: TechPack, side: "front" | "back"): string {
  const { body, zones } = silhouetteFront(pack);
  const items = pack.construction.flatMap((s) => s.items).slice(0, 6);
  const n = zones.length;
  const zoneItems = items.length ? items : ["Regular seam", "Hem", "Finish"];
  const callouts = zoneItems.slice(0, n).map((item, i) => ({
    x: zones[i].x,
    y: zones[i].y - zones[i].r - 26,
    num: i + 1,
    label: item.split(".")[0].trim(),
    leaderFrom: { x: zones[i].x, y: zones[i].y - zones[i].r + 6 },
    leaderTo: zones[i],
  }));
  const legendBox = callouts
    .map(
      (c, i) => `<circle cx="470" cy="${150 + i * 34}" r="10" fill="${INK}"/>
      <text x="470" y="${153.5 + i * 34}" text-anchor="middle" font-family="monospace" font-size="10" fill="#fff">${c.num}</text>
      <text x="490" y="${153.5 + i * 34}" font-family="monospace" font-size="11" fill="${INK}">${esc(c.label.slice(0, 34))}</text>
      <line x1="480" y1="${150 + i * 34}" x2="528" y2="${150 + i * 34}" stroke="${GUIDE}" stroke-width="1" stroke-dasharray="3 3"/>`
    )
    .join("\n");
  const calls = callouts
    .map(
      (c) => `<circle cx="${c.x}" cy="${c.y}" r="10" fill="${INK}"/>
      <text x="${c.x}" y="${c.y + 3.5}" text-anchor="middle" font-family="monospace" font-size="10" fill="#fff">${c.num}</text>
      <line x1="${c.x}" y1="${c.y + 10}" x2="${c.leaderFrom.x}" y2="${c.leaderFrom.y}" stroke="${INK_SOFT}" stroke-width="1.1"/>
      <circle cx="${c.leaderFrom.x}" cy="${c.leaderFrom.y}" r="2.4" fill="${INK_SOFT}"/>`
    )
    .join("\n");

  return sketchDoc(
    side === "front" ? `CONSTRUCTION GUIDE — ${side.toUpperCase()}` : `CONSTRUCTION GUIDE — ${side.toUpperCase()} (FACE B)`,
    700,
    420,
    [
      `<g transform="translate(150,120) scale(0.62)">${body.replace(/#/g, "__HASH__").replace(/<path[^>]*d="[^"]*"/, "$&")}</g>`,
      calls.replace(/__HASH__/g, "#"),
      `<line x1="446" y1="100" x2="200" y2="100" stroke="${GUIDE}" stroke-width="1"/>`,
      `<text x="16" y="100" font-family="monospace" font-size="11" fill="${INK_SOFT}">${side === "front" ? "primary side" : "reverse side"}</text>`,
      legendBox,
      `<text x="470" y="${130 + callouts.length * 34}" font-family="monospace" font-size="10" fill="${INK_SOFT}">zones → construction notes</text>`,
    ]
  );
}

/** Material swatch: visual per type (fabric / thread / label / hardware / trim). */
export function buildMaterialSwatchSvg(m: Material, size = 140): string {
  const type = m.type;
  const sw = size;
  const sh = Math.round(size * 0.72);
  const fill = m.color && /^#([0-9a-f]{6})$/i.test(m.color) ? m.color : "#d8d4dc";
  let art: string;
  let label: string;
  let detail = "";

  if (type === "fabric") {
    // woven cloth: warp + weft thread bands + satin sheen band
    const w = sw;
    const h = sh;
    const dark = shade(fill, 0.78);
    const light = shade(fill, 1.14);
    let weave = "";
    for (let x = 0; x < w; x += 4) {
      weave += `<rect x="${x}" y="0" width="2" height="${h}" fill="${x % 8 ? dark : light}" opacity="0.55"/>`;
    }
    let weft = "";
    for (let y = 0; y < h; y += 4) {
      weft += `<rect x="0" y="${y}" width="${w}" height="2" fill="${y % 8 ? dark : light}" opacity="0.35"/>`;
    }
    art = `<rect width="${w}" height="${h}" fill="${fill}"/>${weave}${weft}
      <rect x="0" y="${Math.round(h * 0.42)}" width="${w}" height="10" fill="#ffffff" opacity="0.12"/>
      <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <!-- corner folds + stitch selvedge -->
      <path d="M0,0 L14,0 L0,14 Z" fill="${dark}" opacity="0.4"/>
      <path d="M${w - 14},${h} L${w},${h} L${w},${h - 14} Z" fill="${dark}" opacity="0.4"/>
      <line x1="2" y1="${h - 4}" x2="${w - 2}" y2="${h - 4}" stroke="${INK}" stroke-width="1.1" stroke-dasharray="5 3"/>`;
    label = "FABRIC";
    detail = compDetail(m);
  } else if (/thread|sewing|lace|cord|ribbon/.test(`${m.name} ${m.type}`)) {
    // spool of thread: cone + wrapped floss, label band
    const cx = sw / 2;
    const cy = sh / 2;
    const sc = Math.min(sw, sh) * 0.38;
    let threads = "";
    for (let i = 0; i < 9; i++) {
      const r = sc * (1 - i * 0.085);
      threads += `<ellipse cx="0" cy="0" rx="${r.toFixed(1)}" ry="${(r * 1.28).toFixed(1)}" fill="none" stroke="${shade(fill, 0.88)}" stroke-width="1.4"/>`;
    }
    art = `<g transform="translate(${cx},${cy})">
      <ellipse rx="${sc}" ry="${sc * 1.32}" fill="${fill}" stroke="${INK}" stroke-width="1.8"/>
      ${threads}
      <ellipse rx="${sc * 0.3}" ry="${sc * 0.4}" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>
      <line x1="${-sc * 0.54}" y1="0" x2="${-sc * 0.2}" y2="0" stroke="${INK}" stroke-width="1"/>
      <!-- loose thread tail -->
      <path d="M${sc * 0.2},${-sc * 0.4} C ${sc * 0.62},${-sc * 0.7} ${sc * 1.1},${-sc * 0.18} ${sc * 0.8},${sc * 0.4}" fill="none" stroke="${fill}" stroke-width="1.6"/>
      <path d="M${sc * 0.8},${sc * 0.4} C ${sc * 0.68},${sc * 0.8} ${sc * 0.86},${sc * 1.06} ${sc * 1.05},${sc * 1.2}" fill="none" stroke="${fill}" stroke-width="1.6"/>
    </g>`;
    label = "THREAD";
    detail = `${m.name}${m.color ? ` · ${m.color}` : ""}`;
  } else if (type === "hardware") {
    const cx = sw / 2;
    const cy = sh / 2;
    const r = Math.min(sw, sh) * 0.3;
    art = `<g transform="translate(${cx},${cy})">
      <ellipse cy="${r * 0.28}" rx="${r * 1.12}" ry="${r * 0.62}" fill="#e8e7ee" opacity="0.75"/>
      <circle r="${r}" fill="${PAPER}" stroke="${INK}" stroke-width="1.8"/>
      <circle r="${r * 0.82}" fill="none" stroke="${shade(fill, 0.86)}" stroke-width="1.1" opacity="0.7"/>
      <circle r="${r * 0.34}" fill="none" stroke="${INK}" stroke-width="1.4"/>
      <line x1="0" y1="${-r * 0.9}" x2="0" y2="${-r * 0.5}" stroke="${INK}" stroke-width="1.6"/>
      <line x1="0" y1="${-r * 0.84}" x2="${r * 0.62}" y2="${-r * 0.62}" stroke="${INK}" stroke-width="1.6"/>
      <circle r="${r * 0.14}" fill="${INK}"/>
      ${[0, 45, 90, 135].map((d) => `<line x1="0" y1="${-r * 0.3}" x2="0" y2="${-r * 0.14}" stroke="${INK}" stroke-width="1.2" transform="rotate(${d})"/>`).join("")}
    </g>`;
    label = "HARDWARE";
    detail = `${m.name}${m.color ? ` · ${m.color}` : ""}`;
  } else if (/label|tag/.test(`${m.name} ${m.type}`)) {
    // printed woven label: folded tag w/ stitched border + half-tone band
    const lw = sw * 0.6;
    const lh = sh * 0.58;
    const lx = sw * 0.2;
    const ly = sh * 0.18;
    const idTxt = (m.name ?? "LOGO TAG").slice(0, 14);
    art = `<g transform="translate(${lx},${ly})">
      <rect width="${lw}" height="${lh}" rx="4" fill="${PAPER}" stroke="${INK}" stroke-width="1.7"/>
      <rect x="1.5" y="1.5" width="${lw - 3}" height="${lh - 3}" rx="3" fill="none" stroke="${GUIDE}" stroke-width="0.7" stroke-dasharray="3 2"/>
      <!-- brand band -->
      <rect x="6" y="7" width="${lw * 0.55}" height="${lh * 0.26}" rx="2" fill="${INK}"/>
      <text x="${8 + lw * 0.55 / 2}" y="${12 + lh * 0.26 / 2}" text-anchor="middle" font-family="monospace" font-size="7" fill="#fff">${esc(idTxt)}</text>
      <!-- composition lines -->
      <line x1="8" y1="${lh * 0.62}" x2="${lw - 8}" y2="${lh * 0.62}" stroke="${INK}" stroke-width="1"/>
      <line x1="8" y1="${lh * 0.76}" x2="${lw * 0.66}" y2="${lh * 0.76}" stroke="${INK}" stroke-width="1"/>
      <line x1="8" y1="${lh * 0.9}" x2="${lw * 0.4}" y2="${lh * 0.9}" stroke="${INK}" stroke-width="1"/>
      <!-- fold notch -->
      <path d="M0,${lh * 0.5 - 3} L6,${lh * 0.5} L0,${lh * 0.5 + 3}" fill="none" stroke="${INK}" stroke-width="1"/>
    </g>`;
    label = "LABEL";
    detail = compDetail(m);
  } else {
    // trim: layered bands
    const h = sh;
    art = `<rect width="${sw}" height="${h}" fill="${fill}"/>
      <rect x="0" y="${h * 0.2}" width="${sw}" height="${h * 0.6}" fill="none" stroke="${shade(fill, 0.85)}" stroke-width="1.4" stroke-dasharray="6 4"/>
      <line x1="0" y1="${h * 0.14}" x2="${sw}" y2="${h * 0.14}" stroke="${INK}" stroke-width="1.2" stroke-dasharray="5 3"/>
      <line x1="0" y1="${h * 0.86}" x2="${sw}" y2="${h * 0.86}" stroke="${INK}" stroke-width="1.2" stroke-dasharray="5 3"/>
      <rect x="0" y="0" width="${sw}" height="${h}" fill="none" stroke="${INK}" stroke-width="1.8"/>`;
    label = "TRIM";
    detail = compDetail(m);
  }

  const detailY = sh + 14;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh + 34}" viewBox="0 0 ${sw} ${sh + 34}">`,
    `<rect width="${sw}" height="${sh + 34}" fill="#ffffff"/>`,
    art,
    `<text x="${sw / 2}" y="${detailY + 6}" text-anchor="middle" font-family="monospace" font-size="9" fill="${INK}">${esc(label)}</text>`,
    detail
      ? `<text x="${sw / 2}" y="${sh + 28}" text-anchor="middle" font-family="monospace" font-size="7.5" fill="${INK_SOFT}">${esc(detail.slice(0, 34))}</text>`
      : ``,
    `</svg>`,
  ].join("\n");
}

function compDetail(m: Material): string {
  const parts: string[] = [];
  const comp = m.composition?.value;
  if (comp && typeof comp === "string") parts.push(comp);
  const gsm = m.gsm?.value;
  if (gsm) parts.push(`${gsm} GSM`);
  return parts.join(" · ");
}

/** Size-chart overview: readable table-chart with per-size labelled values. */
export function buildSizeChartSvg(pack: TechPack, sizes: string[]): string {
  const rows = pack.measurements.filter((m) => sizes.some((s) => typeof m.values[s] === "number"));
  if (!rows.length || !sizes.length) return sketchDoc("SIZE CHART", 620, 80, [
    `<text x="16" y="52" font-family="monospace" font-size="12" fill="${INK_SOFT}">No size data — add measurements to populate the chart.</text>`,
  ]);
  const rowH = 58;
  const headH = 40;
  const h = headH + rows.length * rowH + 14;
  const w = 640;
  const chartX0 = 262;
  const chartW = 300;
  const barH = 11;
  const parts: string[] = [];

  // per-size column x positions
  const minSize = Math.min(...sizes.map((s) => (typeof rows[0].values[s] === "number" ? (rows[0].values[s] as number) : 0)));
  const maxSize = Math.max(...sizes.map((s) => (typeof rows[0].values[s] === "number" ? (rows[0].values[s] as number) : 0)));
  const colX = (i: number) => chartX0 + 18 + (i * (chartW - 36)) / Math.max(1, sizes.length - 1);

  // header row: POM | size labels
  parts.push(
    `<text x="16" y="28" font-family="monospace" font-weight="bold" font-size="12" fill="${INK}">SIZE CHART — ${esc(sizes.join(" · "))}</text>`,
    `<text x="16" y="38" font-family="monospace" font-size="9" fill="${INK_SOFT}">proportional value · smallest → largest · bars to scale</text>`
  );
  sizes.forEach((s, i) => {
    parts.push(
      `<text x="${colX(i)}" y="60" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="11" fill="${INK}">${esc(s)}</text>`,
      `<line x1="${colX(i)}" y1="64" x2="${colX(i)}" y2="${h - 14}" stroke="${GUIDE}" stroke-width="1" stroke-dasharray="3 4"/>`
    );
  });
  parts.push(`<line x1="16" y1="64" x2="${chartX0 + chartW}" y2="64" stroke="${INK}" stroke-width="1.4"/>`);

  rows.forEach((m, r) => {
    const y = headH + r * rowH;
    const vals = sizes.map((s) => (typeof m.values[s] === "number" ? (m.values[s] as number) : 0));
    const vmax = Math.max(...vals);
    const vmin = Math.min(...vals);
    const span = vmax - vmin;
    const step = sizes.length > 1 ? span / (sizes.length - 1) : 0;
    parts.push(
      `<text x="16" y="${y + 16}" font-family="monospace" font-weight="bold" font-size="11" fill="${INK}">${esc(m.id)}</text>`,
      `<text x="16" y="${y + 30}" font-family="monospace" font-size="9" fill="${INK_SOFT}">${esc(m.name.slice(0, 30))}</text>`,
      `<text x="252" y="${y + 30}" text-anchor="end" font-family="monospace" font-size="9" fill="${INK_SOFT}">${esc(m.unit ?? "cm")} · Δ${span.toFixed(1)}</text>`
    );
    sizes.forEach((s, i) => {
      const v = vals[i];
      const len = vmax === vmin ? 14 : 10 + ((v - vmin) / Math.max(1, vmax - vmin)) * (chartW - 46);
      const bx = colX(i) - len / 2;
      const by = y + 34;
      parts.push(
        `<rect x="${bx}" y="${by}" width="${len}" height="${barH}" rx="2" fill="#6d4aff"/>`,
        `<rect x="${bx}" y="${by}" width="${len}" height="${barH}" rx="2" fill="none" stroke="${INK}" stroke-width="0.7" opacity="0.5"/>`,
        `<text x="${colX(i)}" y="${by - 4}" text-anchor="middle" font-family="monospace" font-size="9" fill="${INK}">${v}</text>`
      );
      if (Math.abs(step) > 0.001 && i > 0) {
        // grade delta
        parts.push(
          `<line x1="${colX(i - 1)}" y1="${by + barH + 4}" x2="${colX(i)}" y2="${by + barH + 4}" stroke="${GUIDE}" stroke-width="0.9" stroke-dasharray="2 3"/>`
        );
      }
    });
    if (Math.abs(step) > 0.001) {
      parts.push(
        `<text x="${chartX0 + chartW + 8}" y="${y + barH + 8}" font-family="monospace" font-size="8" fill="${INK_SOFT}">+${step.toFixed(1)}/size</text>`
      );
    }
  });

  parts.push(
    `<text x="16" y="${h - 2}" font-family="monospace" font-size="8" fill="${INK_SOFT}">values in ${rows[0].unit ?? "cm"} · confirm grading plan before cutting</text>`
  );

  return sketchDoc("SIZE CHART OVERVIEW", w, h, parts);
}

/** ISO 3758 garment care symbols strip — printed-labelled strip w/ composition. */
export function buildCareLabelSvg(pack?: TechPack): string {
  const box = 66;
  const h = 134;
  const gap = 12;
  const startX = 16;
  const startY = 20;
  const stroke = INK;

  const labelTitle = pack
    ? `${pack.product.name} — MAIN FABRIC`
    : "CARE LABEL — ISO 3758 SYMBOLS";
  const compLine = pack?.materials
    .filter((m) => m.type === "fabric")
    .map((m) => String(m.composition?.value ?? "100% cotton"))
    .slice(0, 2)
    .join(" · ");
  const compTxt = compLine ? compLine : "MAIN 100% COTTON · LINING 100% COTTON";

  const symbol = (i: number): string => {
    const x = startX + i * (box + gap);
    const y = startY;
    const cx = x + box / 2;
    switch (i) {
      case 0: // wash — tub with water line + 40°
        return [
          `<path d="M ${x + 6} ${y + 26} h ${box - 12} l -9 26 a 9 9 0 0 1 -9 9 h ${-(box - 36)} a 9 9 0 0 1 -9 -9 z" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`,
          `<line x1="${x + 12}" y1="${y + 26}" x2="${x + 8}" y2="${y + 18}" stroke="${stroke}" stroke-width="2.2"/>`,
          `<line x1="${x + 14}" y1="${y + 20}" x2="${x + box - 14}" y2="${y + 20}" stroke="${stroke}" stroke-width="1" opacity="0.7"/>`,
          `<text x="${cx}" y="${y + 49}" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="${stroke}">40°</text>`,
        ].join("");
      case 1: // bleach — empty triangle (bleach allowed) with small 'i'? standard: triangle = bleach allowed
        return `<path d="M ${cx} ${y + 10} L ${x + box - 8} ${y + box - 14} L ${x + 8} ${y + box - 14} Z" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`;
      case 2: // tumble dry — square with circle + small frame
        return [
          `<rect x="${x + 7}" y="${y + 11}" width="${box - 14}" height="${box - 24}" fill="none" stroke="${stroke}" stroke-width="2.2"/>`,
          `<circle cx="${cx}" cy="${y + 11 + (box - 24) / 2}" r="${(box - 34) / 2}" fill="none" stroke="${stroke}" stroke-width="2.2"/>`,
          `<text x="${cx}" y="${y + box - 5}" text-anchor="middle" font-family="monospace" font-size="7" fill="${stroke}">LOW</text>`,
        ].join("");
      case 3: // iron medium — iron with one dot + handle
        return [
          `<path d="M ${x + 8} ${y + 38} h ${box - 16} a 7 7 0 0 1 7 7 l 0 4 h ${-(box - 10)} l 0 -5 a 8 8 0 0 1 -5 -6 z" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"/>`,
          `<line x1="${x + 8}" y1="${y + 38}" x2="${x + 18}" y2="${y + 20}" stroke="${stroke}" stroke-width="2.2"/>`,
          `<circle cx="${cx - 3}" cy="${y + 24}" r="3.6" fill="${stroke}"/>`,
        ].join("");
      case 4: // dry clean — circle with P
        return [
          `<circle cx="${cx}" cy="${y + (box - 10) / 2}" r="${(box - 22) / 2}" fill="none" stroke="${stroke}" stroke-width="2.2"/>`,
          `<text x="${cx}" y="${y + (box - 10) / 2 + 7}" text-anchor="middle" font-family="monospace" font-size="15" font-weight="bold" fill="${stroke}">P</text>`,
        ].join("");
      case 5: // dry flat — square with single line under
        return [
          `<rect x="${x + 9}" y="${y + 8}" width="${box - 18}" height="${box - 26}" fill="none" stroke="${stroke}" stroke-width="2.2"/>`,
          `<line x1="${x + 11}" y1="${y + box - 12}" x2="${x + box - 11}" y2="${y + box - 12}" stroke="${stroke}" stroke-width="2.2"/>`,
        ].join("");
      default:
        return "";
    }
  };

  const titles = ["WASH 40°", "BLEACH", "TUMBLE DRY", "IRON MED", "DRY CLEAN P", "DRY FLAT"];
  const parts: string[] = [];
  parts.unshift(
    `<text x="16" y="13" font-family="monospace" font-weight="bold" font-size="10" fill="${INK}">${esc(labelTitle)}</text>`,
    `<text x="16" y="50" font-family="monospace" font-size="10" fill="${INK}">${esc(compTxt.slice(0, 60))}</text>`
  );
  for (let i = 0; i < 6; i++) {
    parts.push(
      `<rect x="${startX + i * (box + gap) - 3}" y="${startY - 3}" width="${box + 6}" height="${box + 6 + 14}" fill="#ffffff" stroke="${GUIDE}" stroke-width="1"/>`,
      symbol(i),
      `<text x="${startX + i * (box + gap) + box / 2}" y="${startY + box + 24}" text-anchor="middle" font-family="monospace" font-size="8" fill="${INK_SOFT}">${titles[i]}</text>`
    );
  }
  // label border stitch
  parts.push(
    `<rect x="${startX - 6}" y="${startY - 6}" width="${6 * (box + gap) + 12}" height="${box + 26}" fill="none" stroke="${GUIDE}" stroke-width="1.2" stroke-dasharray="4 3"/>`
  );

  const lastTitleX = startX + 5 * (box + gap) + box;
  const totalW = lastTitleX + 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${h}" width="${totalW}" height="${h}" font-family="monospace">${parts.join("")}</svg>`;
}
