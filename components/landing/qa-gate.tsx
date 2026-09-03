import { OctagonX, TriangleAlert, Info } from "lucide-react";
import { Reveal } from "@/components/landing/primitives";

/* Real severity counts from lib/quality/engine.ts — 28 CHECK_DEFS total. */
const levels = [
  {
    icon: OctagonX,
    count: 9,
    name: "Blocking",
    chip: "bg-[#fbe9e7] text-[#b3261e]",
    body: "Export stays locked until these are resolved — empty BOM, missing measurements, no stitching spec.",
  },
  {
    icon: TriangleAlert,
    count: 13,
    name: "Warning",
    chip: "bg-[#fdeee2] text-[#b4550f]",
    body: "Issues worth a reviewer's eye — missing construction notes, sparse QC checks, no packaging spec.",
  },
  {
    icon: Info,
    count: 6,
    name: "Info",
    chip: "bg-[#e9e9f5] text-[var(--signal-deep)]",
    body: "Non-blocking notes — labels, packaging details, hardware detection left for human confirmation.",
  },
];

export function QaGate() {
  return (
    <section id="qa" className="scroll-mt-20 border-b border-ink/10 bg-paper bg-blueprint">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--signal-deep)]">
              The QA gate
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.015em] text-balance sm:text-4xl lg:text-[2.9rem]">
              28 checks stand between a draft and an export
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
              Every generated pack is scored against the same checklist a
              technical designer would run. The export button stays disabled
              while a blocking issue is open — a pack that cannot survive the
              gate cannot reach a factory.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <span className="font-heading text-7xl font-semibold leading-none tracking-[-0.03em] text-[var(--masdr-purple)]">
                28
              </span>
              <span className="max-w-[16ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ink-soft">
                Automated checks per pack, every generation
              </span>
            </div>
          </Reveal>

          <div className="space-y-4">
            {levels.map((l, i) => (
              <Reveal key={l.name} delay={i * 120}>
                <div className="flex items-start gap-5 rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet transition-shadow duration-400 hover:shadow-sheet-lg">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${l.chip}`}>
                    <l.icon className="size-5" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-heading text-lg font-semibold tracking-[-0.01em]">
                        {l.name}
                      </h3>
                      <span className="font-heading text-2xl font-semibold text-[var(--masdr-purple)]">
                        {l.count}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                      {l.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={380}>
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                9 + 13 + 6 = 28 — counts from the shipped engine, not marketing
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
