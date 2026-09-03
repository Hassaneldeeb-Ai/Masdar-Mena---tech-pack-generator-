/** Change-impact mapping (§37): patch field root → affected modules + dashboard tabs. */
export interface Impact {
  modules: string[];
  tabs: string[];
}

const ROOT_IMPACT: Record<string, Impact> = {
  product: { modules: ["Product definition"], tabs: ["overview", "requirements"] },
  materials: { modules: ["Materials", "BOM"], tabs: ["bom", "requirements"] },
  bom: { modules: ["BOM", "Costing"], tabs: ["bom"] },
  measurements: { modules: ["Dimensions", "Requirements"], tabs: ["measurements", "requirements", "anatomy"] },
  construction: { modules: ["Assembly", "Manufacturing"], tabs: ["construction", "anatomy"] },
  stitching: { modules: ["Assembly", "Manufacturing"], tabs: ["construction", "anatomy"] },
  colorways: { modules: ["Variants"], tabs: ["colorways", "requirements"] },
  labels: { modules: ["Labels", "Compliance"], tabs: ["labels", "requirements"] },
  quality_control: { modules: ["Quality control"], tabs: ["quality", "requirements"] },
  packaging: { modules: ["Packaging"], tabs: ["labels"] },
  assumptions: { modules: ["Assumptions"], tabs: ["assumptions"] },
};

export function impactForField(field: string): Impact {
  const root = field.split(".")[0];
  return ROOT_IMPACT[root] ?? { modules: [root], tabs: [] };
}

export function impactForFields(fields: string[]): Impact {
  const modules = new Set<string>();
  const tabs = new Set<string>();
  for (const f of fields) {
    const imp = impactForField(f);
    for (const m of imp.modules) modules.add(m);
    for (const ti of imp.tabs) tabs.add(ti);
  }
  return { modules: [...modules], tabs: [...tabs] };
}
