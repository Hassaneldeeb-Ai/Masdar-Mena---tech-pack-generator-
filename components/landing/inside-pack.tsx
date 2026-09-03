import { Reveal } from "@/components/landing/primitives";

/* Real sections of the TechPack schema (lib/schemas/tech-pack.ts) —
   every one ships in the generated pack and the JSON export. */
const sections: { name: string; detail: string }[] = [
  { name: "Product", detail: "Identity, category, description" },
  { name: "Materials", detail: "Composition, GSM, fabric width" },
  { name: "Bill of materials", detail: "Line items with estimated consumption" },
  { name: "Measurements", detail: "POM chart graded S / M / L" },
  { name: "Construction", detail: "Assembly notes, e.g. reversible build" },
  { name: "Stitching", detail: "Seam types, SPI, thread Tex" },
  { name: "Colourways", detail: "Palette with real hex values" },
  { name: "Labels", detail: "Care, origin, retail labels" },
  { name: "Quality control", detail: "Inspection points per section" },
  { name: "Packaging", detail: "Polybag, carton, fold method" },
  { name: "Assumptions", detail: "What the AI decided — surfaced, not hidden" },
  { name: "Warnings", detail: "Risks a reviewer must sign off" },
];

/* Demo pack facts (app/api/demo) — real values, nothing invented. */
const demoRow = [
  { k: "Product", v: "Reversible Cotton Bucket Hat" },
  { k: "Quantity", v: "100 units" },
  { k: "Sizes", v: "S · M · L" },
  { k: "Colourway A", v: "Khaki — #C3B091" },
  { k: "Colourway B", v: "Black — #111111" },
  { k: "Construction", v: "Reversible assembly" },
];

export function InsidePack() {
  return (
    <section id="pack" className="scroll-mt-20 border-b border-ink/10 bg-sheet">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
        <div>
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--signal-deep)]">
              Inside the pack
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.015em] text-balance sm:text-4xl lg:text-[2.9rem]">
              Twelve sections a factory recognises
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
              The generator produces the full anatomy of a technical
              specification — then every field stays editable in the browser
              before you export.
            </p>
          </Reveal>

          <ul className="mt-9 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.name}>
                <Reveal delay={i * 45}>
                  <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper px-4 py-3 transition-colors duration-300 hover:border-[var(--masdr-lav)]/50">
                    <span className="font-mono text-[10px] text-[var(--masdr-lav)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">{s.name}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-soft">{s.detail}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        {/* ——— spec-sheet card with real demo values ——— */}
        <Reveal delay={150}>
          <div className="lg:sticky lg:top-10">
            <div className="relative rounded-[28px] border border-ink/15 bg-sheet p-7 shadow-sheet-lg">
              <div className="flex items-center justify-between border-b-2 border-ink pb-4">
                <p className="font-heading text-lg font-semibold">
                  Spec sheet — demo project
                </p>
                <span className="stamp rounded-full px-3 py-1 font-mono text-[9px] uppercase text-[#b4550f]">
                  AI generated
                </span>
              </div>
              <dl className="mt-2">
                {demoRow.map((row) => (
                  <div key={row.k} className="flex items-baseline gap-3 py-3">
                    <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                      {row.k}
                    </dt>
                    <span aria-hidden className="leader-dots h-px flex-1" />
                    <dd className="shrink-0 text-sm font-semibold">{row.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                {["C3B091", "111111"].map((hex) => (
                  <span key={hex} className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[10px] text-ink-soft">
                    <span className="size-3.5 rounded-full border border-ink/20" style={{ background: `#${hex}` }} />
                    #{hex}
                  </span>
                ))}
                <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[10px] text-ink-soft">
                  <span className="size-3.5 rounded-full border border-ink/20 bg-gradient-to-r from-[#f5f0e6] to-[#232b32]" />
                  Reversible
                </span>
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Values shown are the real demo pack, not a mockup
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
