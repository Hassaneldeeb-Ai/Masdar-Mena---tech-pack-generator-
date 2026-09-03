import type { TechPack } from "@/lib/schemas/tech-pack";

/**
 * Deterministic estimated cost sheet computed from the BOM + packaging.
 * All unit prices are ASSUMPTION defaults — the sheet is a quoting
 * starting point, not a quotation.
 */

export interface CostLine {
  item: string;
  basis: string;
  qty: string;
  unit: string;
  unitPrice: string;
  total: string;
}

export interface CostSheet {
  lines: CostLine[];
  materialTotal: number;
  labourTotal: number;
  overheadTotal: number;
  perUnit: number;
  perUnitRounded: number;
  qty: number;
  grandTotal: number;
  currency: string;
  pricesAreAssumptions: boolean;
}

const FABRIC_PRICE = 6.5; // EUR / metre at 145 cm (assumption)
const TRIM_FACTOR = 0.35; // EUR per patch unit (assumption)
const LABOUR_MINUTES = 9.5;
const LABOUR_RATE = 0.32; // EUR / minute (assumption, CMT)
const OVERHEAD_PCT = 0.15;

const FABRIC_REGEX = /fabric|shell|lining|weave|knit|canvas|twill|cotton|polyester/i;
const TRIM_REGEX = /label|tag|thread|zip|button|rivet|drawcord|elastic|cord|hook|trim/i;

export function computeCostSheet(pack: TechPack, qty: number | null): CostSheet {
  const currency = "EUR";
  const lines: CostLine[] = [];
  let materialTotal = 0;

  for (const row of pack.bom) {
    const materialName = row.material_name || row.component_name;
    const isFabric = FABRIC_REGEX.test(`${materialName} ${row.specification}`.toLowerCase());
    const isTrim = TRIM_REGEX.test(`${materialName} ${row.specification}`.toLowerCase());

    const consumptionNum = typeof row.consumption === "number" ? row.consumption : parseFloat(row.consumption);
    const consumption = Number.isFinite(consumptionNum) ? consumptionNum : 0;
    const unit = row.unit || "unit";
    const unitPrice = isFabric
      ? Math.round(FABRIC_PRICE * 100) / 100
      : isTrim
        ? Math.round(TRIM_FACTOR * 100) / 100
        : 0.2;
    const total = Math.round((consumption * unitPrice) * 100) / 100;
    materialTotal += total;

    lines.push({
      item: row.component_name,
      basis: `${consumption} ${unit} @ ${unitPrice.toFixed(2)}`,
      qty: String(consumption),
      unit,
      unitPrice: unitPrice.toFixed(2),
      total: total.toFixed(2),
    });
  }

  const nQty = Number(qty);
  const effectiveQty = Number.isFinite(nQty) && nQty > 0 ? nQty : 1;
  const labourTotal = Math.round(LABOUR_MINUTES * LABOUR_RATE * 100) / 100;
  const overheadTotal = Math.round((materialTotal + labourTotal) * OVERHEAD_PCT * 100) / 100;
  const perUnit = Math.round((materialTotal + labourTotal + overheadTotal) * 100) / 100;
  const perUnitRounded = Math.ceil(perUnit * 100) / 100;
  const grandTotal = Math.round(perUnitRounded * effectiveQty * 100) / 100;

  return {
    lines,
    materialTotal: Math.round(materialTotal * 100) / 100,
    labourTotal,
    overheadTotal,
    perUnit,
    perUnitRounded,
    qty: effectiveQty,
    grandTotal,
    currency,
    pricesAreAssumptions: true,
  };
}
