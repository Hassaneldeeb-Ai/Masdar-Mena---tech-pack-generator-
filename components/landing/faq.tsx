"use client";

import { useState } from "react";

/* Answers cite only verifiable product behaviour. */
const faqs = [
  {
    q: "What do I need to provide?",
    a: "One product photo and a short plain-language brief — product name, brand, quantity and colour intent. The bucket-hat demo uses exactly this input: a photo, a description, 100 units and two colourways.",
  },
  {
    q: "What does the generator produce?",
    a: "A structured tech pack with twelve editable sections: product identity, materials, bill of materials with estimated consumption, POM measurements graded S / M / L, construction notes, stitching specification, colourways, labels, quality control, packaging, plus surfaced assumptions and warnings.",
  },
  {
    q: "Can I trust the values it generates?",
    a: "Every field carries a provenance state — observed, inferred, assumed, user provided or verified — with a confidence score. Fields the model had to assume are flagged for your review instead of passing as fact, and you confirm them in the editor.",
  },
  {
    q: "What stops a bad pack from reaching a factory?",
    a: "28 automated QA checks run on every pack across three levels: blocking, warning and info. Export stays locked while any blocking issue is unresolved — an empty BOM or missing measurement chart cannot be exported.",
  },
  {
    q: "What formats can I export?",
    a: "A print-ready PDF for the factory floor and a JSON file for your PLM or records. Both are generated from the same reviewed pack, and both are locked until blocking issues are resolved.",
  },
  {
    q: "Do I need any technical apparel knowledge?",
    a: "No. The interface asks plain-language questions and the AI translates them into factory vocabulary — BOM, POM grading, stitch Tex and construction notes are generated for you, then editable in plain forms.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 border-b border-ink/10 bg-sheet">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--signal-deep)]">
            FAQ
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.015em] text-balance sm:text-4xl">
            Questions before you generate one
          </h2>
        </div>

        <dl className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-[20px] border transition-colors duration-300 ${
                  isOpen ? "border-[var(--masdr-lav)]/60 bg-paper" : "border-ink/10 bg-sheet"
                }`}
              >
                <dt>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-mono text-xs text-[var(--masdr-lav)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-heading text-[15px] font-semibold leading-snug sm:text-base">
                      {f.q}
                    </span>
                    <span
                      aria-hidden
                      className={`grid size-7 shrink-0 place-items-center rounded-full border border-ink/15 text-ink-soft transition-transform duration-300 ${
                        isOpen ? "rotate-45 border-[var(--masdr-lav)]/60 text-[var(--signal-deep)]" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                </dt>
                <dd
                  id={`faq-panel-${i}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pl-[3.4rem] text-sm leading-relaxed text-ink-soft">
                      {f.a}
                    </p>
                  </div>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
