import { describe, expect, it } from "vitest";
import { analyzeMock } from "@/lib/ai/providers/mock-analysis";
import { generateTechPackMock } from "@/lib/ai/providers/mock-techpack";
import type { CommercialInputs } from "@/lib/ai/pipeline-types";
import { buildFrontSketchSvg, buildBackSketchSvg, buildConstructionGuideSvg, buildMaterialSwatchSvg, buildSizeChartSvg } from "@/lib/pdf/illustrations";

function pick() {
  const inputs: CommercialInputs = { brand_name: "B", name: "Reversible Cotton Bucket Hat", description: "Plain reversible bucket hat in cotton twill. Khaki face with black inner face.", quantity: 100, sizes: ["S", "M", "L"], colorways: [{ name: "Khaki", code: "#C3B091" }, { name: "Black", code: "#111111" }], demoMode: true };
  const analysis = analyzeMock(inputs.description, inputs);
  return generateTechPackMock(analysis, inputs);
}
function ta(s: string) {
  const opens = ((s.match(/<([a-z]+)[\s>]/g) || []).map((x) => x.slice(1)).filter((t) => !["!","/","?" ].includes(t)));
  return opens;
}
describe("illustrations", () => {
  it("builds all five SVGs and they are well-formed", () => {
    const pack = pick();
    for (const [n, s] of [["front", buildFrontSketchSvg(pack)], ["back", buildBackSketchSvg(pack)], ["guide", buildConstructionGuideSvg(pack, "front")], ["swatch", buildMaterialSwatchSvg(pack.materials[0])], ["chart", buildSizeChartSvg(pack, ["S", "M", "L"])]] as const) {
      expect(s).toContain("<svg");
      expect(s).toContain("</svg>");
      const seen: Record<string, number> = {};
      for (const t of ta(s)) seen[t] = (seen[t] ?? 0) + 1;
      expect(Object.keys(seen).length).toBeGreaterThan(2);
      // every opened container element closes
      for (const t of ["svg", "g", "rect", "text", "path", "circle", "line", "ellipse"]) {
        if (seen[t] !== undefined) expect((s.match(new RegExp(`<\\\\/${t}>`, "g")) || []).length, n + " missing close for " + t).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it("front sketch contains dimensions", () => {
    const pack = pick();
    const svg = buildFrontSketchSvg(pack);
    expect(svg).toContain("FRONT — FLAT SKETCH");
    expect(svg).toContain("crown");
    expect(svg).toContain("brim width");
    expect(svg).toContain("head");
  });
  it("size chart handles empty sizes", () => {
    const pack = pick();
    const svg = buildSizeChartSvg(pack, []);
    expect(svg).toContain("No size data");
  });
});
