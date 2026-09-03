import { describe, expect, it } from "vitest";
import { computeCostSheet } from "@/lib/pdf/costing";
import { buildCostTableRows } from "@/lib/pdf/build-pdf";
import { analyzeMock } from "@/lib/ai/providers/mock-analysis";
import { generateTechPackMock } from "@/lib/ai/providers/mock-techpack";
import type { CommercialInputs } from "@/lib/ai/pipeline-types";

function demoPack() {
  const inputs: CommercialInputs = {
    brand_name: "B",
    name: "Reversible Cotton Bucket Hat",
    description: "Plain reversible bucket hat in cotton twill.",
    quantity: 100,
    sizes: ["S", "M", "L"],
    colorways: [{ name: "Khaki", code: "#C3B091" }],
    demoMode: true,
  };
  return generateTechPackMock(analyzeMock(inputs.description, inputs), inputs);
}

describe("computeCostSheet", () => {
  it("produces a line per BOM row with positive totals", () => {
    const cs = computeCostSheet(demoPack(), 100);
    expect(cs.lines.length).toBeGreaterThan(0);
    expect(cs.materialTotal).toBeGreaterThan(0);
    expect(cs.labourTotal).toBeGreaterThan(0);
    expect(cs.overheadTotal).toBeGreaterThan(0);
    expect(cs.perUnit).toBeGreaterThan(0);
    expect(cs.grandTotal).toBe(cs.perUnitRounded * 100);
  });

  it("mutates totals with quantity", () => {
    const pack = demoPack();
    const q50 = computeCostSheet(pack, 50);
    const q200 = computeCostSheet(pack, 200);
    expect(q200.grandTotal).toBe(q50.grandTotal * 4);
    expect(q200.perUnitRounded).toBe(q50.perUnitRounded);
  });

  it("assumes prices and flags them", () => {
    const cs = computeCostSheet(demoPack(), null);
    expect(cs.pricesAreAssumptions).toBe(true);
    expect(cs.currency).toBe("EUR");
  });
});

describe("buildCostTableRows (PDF table integrity)", () => {
  const COST_TABLE_COLUMNS = 4;

  it("keeps every row's effective column count equal to the 4-column table", () => {
    const cs = computeCostSheet(demoPack(), 100);
    const rows = buildCostTableRows(cs);
    expect(rows.length).toBe(cs.lines.length + 3);
    for (const row of rows) {
      const effective = row.reduce<number>((sum, cell) => {
        const span = (cell as { colSpan?: number }).colSpan ?? 1;
        return sum + span;
      }, 0);
      expect(effective).toBe(COST_TABLE_COLUMNS);
    }
  });

  it("never emits NaN into any cell", () => {
    const cs = computeCostSheet(demoPack(), 100);
    const rows = buildCostTableRows(cs);
    for (const row of rows) {
      for (const cell of row) {
        expect(String((cell as { text?: unknown }).text)).not.toContain("NaN");
      }
    }
  });
});
