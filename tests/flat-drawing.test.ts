import { describe, expect, it } from "vitest";
import { buildFlatDrawingSvg } from "@/lib/pdf/flat-drawing";
import type { TechPack } from "@/lib/schemas/tech-pack";
import { generateTechPackMock } from "@/lib/ai/providers/mock-techpack";
import { analyzeMock } from "@/lib/ai/providers/mock-analysis";
import type { CommercialInputs } from "@/lib/ai/pipeline-types";

const inputs: CommercialInputs = {
  brand_name: "Test",
  name: "Reversible Cotton Bucket Hat",
  description: "Reversible bucket hat in cotton twill.",
  quantity: 100,
  sizes: ["S", "M", "L"],
  colorways: [
    { name: "Khaki", code: "#C3B091" },
    { name: "Black", code: "#111111" },
  ],
  demoMode: true,
};

describe("buildFlatDrawingSvg", () => {
  it("produces a self-contained SVG referencing the measurement table", () => {
    const analysis = analyzeMock(inputs.description, inputs);
    const pack: TechPack = generateTechPackMock(analysis, inputs);
    const svg = buildFlatDrawingSvg(pack);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("POM VIEW — TOP / CROWN DOWN");
    expect(svg).toContain("Head opening 56 cm");
    expect(svg).toContain("<circle");
  });

  it("renders a bare (no-data) pack without throwing", () => {
    const pack = buildFlatDrawingSvg({
      measurements: [],
    } as unknown as TechPack);
    expect(pack).toContain("<svg");
    expect(pack).toContain("Head opening 56 cm");
  });
});
