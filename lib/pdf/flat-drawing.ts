import type { TechPack } from "@/lib/schemas/tech-pack";

/**
 * Deterministic POM flat-drawing (top view) schematic. No AI art — computed
 * from the measurement table so every dimension line reflects the spec.
 */
export function buildFlatDrawingSvg(pack: TechPack): string {
  const m = pack.measurements;
  const head = (name: string) =>
    m.find((x) => x.name.toLowerCase().includes(name)) ?? m.find((x) => x.how_to_measure.toLowerCase().includes(name));

  const headVal = (name: string): number | undefined => {
    const rec = head(name);
    const first = rec?.values[Object.keys(rec?.values ?? {})[0] ?? ""];
    return typeof first === "number" ? first : undefined;
  };

  const style = (extra: string) => `font-family="monospace" font-size="13" fill="#232b32" ${extra}`;
  const dim = (x1: number, y1: number, x2: number, y2: number, label: string, sx: number, sy: number, anchor = "middle") =>
    `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5c6670" stroke-width="1.4"/>
    <line x1="${Math.min(x1, x2) - (x1 === x2 ? 4 : 0)}" y1="${y1 === y2 ? y1 - 95 : y1}" x2="${Math.max(x1, x2) + (x1 === x2 ? 4 : 0)}" y2="${y2 === y1 ? y2 - 95 : y2}"/>
    <text x="${sx}" y="${sy}" text-anchor="${anchor}" ${style("font-size=\"12px\"")}>${label}</text>`;

  // Top view: concentric circles — brim / crown fold / head opening.
  const cx = 250, cy = 250;
  const headOpening = headVal("head opening") ?? headVal("head circumference") ?? 56;
  const brim = headVal("brim");
  const crown = headVal("crown");
  const rOpen = 55;
  const rCrown = 95;
  const rBrim = crest(brim ?? 30);
  function crest(v: number) { return 55 + (v / 10) * 12; }

  const s = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400">`,
    `<rect width="500" height="400" fill="#ffffff"/>`,
    // construction guides
    `<line x1="0" y1="cy" x2="500" y2="${cy}" stroke="#e7e5e4" stroke-width="1"/>`.replace("cy", `${cy}`),
    `<line x1="${cx}" y1="120" x2="${cx}" y2="380" stroke="#e7e5e4" stroke-width="1"/>`,
    // brim
    `<circle cx="${cx}" cy="${cy}" r="${rBrim}" fill="#f5f5f4" stroke="#232b32" stroke-width="2"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${rCrown}" fill="none" stroke="#232b32" stroke-width="1.6" stroke-dasharray="6 4"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${rOpen}" fill="none" stroke="#232b32" stroke-width="1.2"/>`,
    // centre marks
    `<line x1="${cx - 7}" y1="${cy}" x2="${cx + 7}" y2="${cy}" stroke="#232b32" stroke-width="1"/>`,
    `<line x1="${cx}" y1="${cy - 7}" x2="${cx}" y2="${cy + 7}" stroke="#232b32" stroke-width="1"/>`,
    dim(cx, cy - rOpen, cx, cy - rCrown, `Head opening ${headOpening} cm`, cx + 8, cy - (rOpen + rCrown) / 2),
    dim(cx, cy - rCrown, cx, cy - rBrim, `Brim width ${brim ?? "—"} cm`, cx + 8, cy - (rCrown + rBrim) / 2),
    dim(0, cy, cx - rCrown, cy, `Crown ${crown ?? "—"} cm`, 12, cy + 130, "start"),
    // labels
    `<text x="${cx}" y="${cy + rOpen + 26}" text-anchor="middle" ${style("font-size=\"12px\"")}>A — head opening</text>`,
    `<text x="${cx}" y="${cy + rCrown + 26}" text-anchor="middle" ${style("font-size=\"12px\"")}>B — crown</text>`,
    `<text x="${cx}" y="${cy + rBrim + 26}" text-anchor="middle" ${style("font-size=\"12px\"")}>C — brim</text>`,
    `<text x="12" y="16" ${style("font-size=\"11px\"")}>POM VIEW — TOP / CROWN DOWN</text>`,
    `<text x="12" y="32" ${style("font-size=\"10px\"")}>Scale approx. · dimension lines to measurement table</text>`,
    `</svg>`,
  ];
  const svg = s.join("\n");
  return svg;
}
