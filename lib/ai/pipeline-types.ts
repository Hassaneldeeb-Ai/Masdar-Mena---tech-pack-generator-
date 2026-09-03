import type { Colorway, ProductAnalysis, TechPack } from "@/lib/schemas/tech-pack";

/** Raw user input passed into the generation pipeline. */
export interface CommercialInputs {
  brand_name?: string;
  name?: string;
  category?: string;
  description: string;
  intended_customer?: string;
  target_market?: string;
  quantity?: number;
  sizes: string[];
  colorways?: { name: string; code?: string }[];
  notes?: string;
  demoMode?: boolean;
}

/** Bridge type so platform code can stay provider-agnostic. */
export type { Colorway, ProductAnalysis, TechPack };
