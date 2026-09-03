import {
  Camera,
  ScanLine,
  FileText,
  ShieldCheck,
  FileDown,
  ArrowDown,
} from "lucide-react";
import { Reveal } from "@/components/landing/primitives";

const steps = [
  {
    icon: Camera,
    num: "01",
    title: "Upload",
    body: "One product photo plus a plain-language brief — name, brand, quantity, colourways. No technical vocabulary required.",
  },
  {
    icon: ScanLine,
    num: "02",
    title: "Analyse",
    body: "Vision analysis reads the product: category, structure and construction cues become the skeleton of the specification.",
  },
  {
    icon: FileText,
    num: "03",
    title: "Draft",
    body: "The full pack is generated: BOM with estimated consumption, POM chart graded S / M / L, stitch spec with thread Tex, colourways with hex values.",
  },
  {
    icon: ShieldCheck,
    num: "04",
    title: "Review",
    body: "28 automated checks run across three severity levels. Blocking issues surface before anything ships; every field carries its provenance.",
  },
  {
    icon: FileDown,
    num: "05",
    title: "Export",
    body: "Download PDF for the factory floor or JSON for your PLM. Exports stay locked until every blocking issue is resolved.",
  },
];

export function Workflow() {
  return (
    <section id="how" className="scroll-mt-20 border-b border-ink/10 bg-sheet">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <Reveal>
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--signal-deep)]">
                The pipeline
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.015em] text-balance sm:text-4xl lg:text-[2.9rem]">
                Five steps from photo to factory handoff
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
              The same engine runs the demo pack and your own products — no
              stage is skipped, nothing is presented without a source.
            </p>
          </div>
        </Reveal>

        <ol className="relative grid grid-cols-1 gap-5 md:grid-cols-5 md:gap-4">
          {/* connector */}
          <div
            aria-hidden
            className="absolute left-[27px] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-ink/15 to-transparent md:left-0 md:top-[52px] md:h-px md:w-full md:bg-gradient-to-r"
          />
          {steps.map((s, i) => (
            <li key={s.num} className="relative">
              <Reveal delay={i * 110} className="h-full">
                <div className="group flex h-full flex-col rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet transition-shadow duration-400 hover:glow-purple-soft">
                  <div className="flex items-center justify-between">
                    <span className="relative z-10 grid size-11 place-items-center rounded-full bg-[var(--masdr-purple)] text-white shadow-[0_0_18px_-2px_var(--masdr-purple)] transition-transform duration-400 group-hover:scale-105">
                      <s.icon className="size-5" strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="font-heading text-2xl font-semibold text-[var(--masdr-lav)]/70 transition-colors duration-400 group-hover:text-[var(--masdr-lav)]">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold tracking-[-0.01em]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal delay={200}>
          <div className="mt-10 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            <span>Upload</span>
            <ArrowDown className="hidden size-3.5 md:hidden" aria-hidden />
            <span aria-hidden className="h-px w-10 bg-ink/20" />
            <span className="text-[var(--masdr-purple)]">Editable at every step</span>
            <span aria-hidden className="h-px w-10 bg-ink/20" />
            <span>Export</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
