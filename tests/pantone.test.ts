import { describe, expect, it } from "vitest";
import { nearestPantone } from "@/lib/colorways/pantone";
import { extractColorsFromDescription } from "@/lib/ai/providers/mock-analysis";

describe("nearestPantone", () => {
  it("matches Khaki exactly against its FHI/TCX reference", () => {
    const m = nearestPantone("#C3B091");
    expect(m.code).toBe("15-1116 TCX");
    expect(m.name).toBe("Khaki");
    expect(m.distance).toBe(0);
  });

  it("resolves near-black to a dark reference", () => {
    const m = nearestPantone("#111111");
    expect(m.name).toMatch(/Black|Charcoal|Ink|Night/i);
    expect(m.code).toMatch(/TCX$/);
    expect(m.distance).toBeLessThan(30);
  });

  it("returns a TCX code for any valid hex", () => {
    for (const hex of ["#FF5733", "#2A3356", "#F4F4F1", "#6B8E23"]) {
      const m = nearestPantone(hex);
      expect(m.code).toMatch(/^\d{2}-\d{4} TCX$/);
      expect(m.hex).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe("extractColorsFromDescription", () => {
  it("extracts Khaki + Black from the demo bucket hat description", () => {
    const colors = extractColorsFromDescription(
      "Plain reversible bucket hat in cotton twill. Khaki face with black inner face."
    );
    const names = colors.map((c) => c.name.toLowerCase());
    expect(names).toContain("khaki");
    expect(names).toContain("black");
    const khaki = colors.find((c) => c.name.toLowerCase() === "khaki");
    expect(khaki?.hex).toBe("#C3B091");
    expect(khaki?.pantone).toBe("15-1116 TCX");
    expect(colors.length).toBeLessThanOrEqual(6);
  });

  it("extracts Olive with a Pantone reference", () => {
    const colors = extractColorsFromDescription("Olive twill jacket.");
    expect(colors[0]?.name.toLowerCase()).toContain("olive");
    expect(colors[0]?.pantone).toMatch(/TCX$/);
    expect(colors[0]?.dominance).toBeGreaterThan(0);
  });

  it("falls back to supplied colorways when the description has none", () => {
    const colors = extractColorsFromDescription("A simple tote bag.", [
      { name: "Ecru", code: "#C8AD7F" },
      { name: "Black", code: "#111111" },
    ]);
    expect(colors.length).toBe(2);
    expect(colors[0]?.name).toBe("Ecru");
    expect(colors[0]?.pantone).toMatch(/TCX$/);
  });

  it("falls back to the default Khaki swatch", () => {
    const colors = extractColorsFromDescription("A plain product.");
    expect(colors.length).toBeGreaterThan(0);
    expect(colors[0]?.name).toBe("Khaki");
    expect(colors[0]?.hex).toBe("#C3B091");
  });
});
