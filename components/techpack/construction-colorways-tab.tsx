"use client";

import { Construction, PenLine, Scissors } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { SourceBadge, ConfidenceBar } from "@/components/techpack/field-editor";
import type { Colorway, Project, TechPack } from "@/lib/schemas/tech-pack";

function hexToCss(hex?: string | null): string | undefined {
  if (!hex) return undefined;
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    return `#${cleaned
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }
  if (cleaned.length === 6) return `#${cleaned}`;
  return undefined;
}

/** Split swatch: one card, two wearing faces, cut along the fold line. */
function SplitSwatchCard({ c, index }: { c: Colorway; index: number }) {
  const a = hexToCss(c.face_a);
  const b = hexToCss(c.face_b);
  return (
    <article
      className="animate-fade-up overflow-hidden rounded-[24px] border border-ink/10 bg-sheet shadow-sheet transition-colors duration-300 hover:border-signal/40"
      style={{ ["--d" as string]: `${index * 100}ms` }}
    >
      {/* split swatch visual */}
      <div className="relative grid h-36 grid-cols-2" aria-hidden>
        <div
          className="bg-blueprint-fine"
          style={{ backgroundColor: a ?? "var(--paper)" }}
        />
        <div
          className="bg-blueprint-fine"
          style={{ backgroundColor: b ?? "var(--paper)" }}
        />
        <span className="absolute inset-y-0 left-1/2 w-px bg-ink/60" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sheet px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink shadow-sm">
          fold
        </span>
        {a || b ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-sheet px-2 py-0.5 font-mono text-[9px] text-ink-soft shadow-sm">
            {c.code ?? [c.face_a, c.face_b].filter(Boolean).join(" / ")}
          </span>
        ) : null}
      </div>
      <div className="space-y-3 border-t border-ink/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">
            <span className="mr-2 font-mono text-xs text-signal">CW{c.number}</span>
            {c.name}
          </p>
          {c.pantone ? (
            <span className="rounded-full border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[9px] font-semibold text-ink-soft">
              {c.pantone}
            </span>
          ) : null}
          {c.reversible ? (
            <span className="stamp inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-violet-700">
              <Construction className="size-3" /> Reversible
            </span>
          ) : null}
        </div>
        <dl className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-3.5 rounded-full border border-ink/25"
              style={{ backgroundColor: a ?? "transparent" }}
              aria-hidden
            />
            <dt className="text-ink-soft">Face A (outer)</dt>
            <dd className="ml-auto font-mono">{c.face_a ?? "—"}</dd>
          </div>
          {c.face_b ? (
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-3.5 rounded-full border border-ink/25"
                style={{ backgroundColor: b ?? "transparent" }}
                aria-hidden
              />
              <dt className="text-ink-soft">Face B (inner)</dt>
              <dd className="ml-auto font-mono">{c.face_b}</dd>
            </div>
          ) : null}
        </dl>
        {c.notes ? (
          <p className="border-t border-dashed border-ink/20 pt-2.5 text-xs leading-relaxed text-ink-soft">
            {c.notes}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ConstructionColorwaysTab({
  project,
}: {
  project: Project;
}) {
  const pack = project.tech_pack as TechPack;

  return (
    <>
      <TabsContent value="construction" className="animate-fade-up space-y-8">
        {/* numbered construction timeline */}
        <section className="rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              <Scissors className="size-4" /> Construction detail
            </h3>
            <span className="font-mono text-[10px] text-signal">04 / ASSEMBLY</span>
          </div>
          <div className="space-y-8">
            {pack.construction.map((section, si) => (
              <div key={section.section}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-ink font-mono text-[10px] font-bold text-sheet">
                    {si + 1}
                  </span>
                  <h4 className="text-sm font-semibold tracking-tight">{section.section}</h4>
                  <span aria-hidden className="h-px flex-1 bg-ink/15" />
                </div>
                <ol className="relative ml-3 space-y-0 border-l border-ink/20 pl-6">
                  {section.items.map((item, index) => (
                    <li key={index} className="relative py-2 text-sm leading-relaxed">
                      <span
                        aria-hidden
                        className="absolute -left-[31px] top-3.5 grid size-[18px] place-items-center rounded-full border border-ink/40 bg-paper font-mono text-[9px] font-semibold text-ink"
                      >
                        {index + 1}
                      </span>
                      <span className="text-ink">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* stitch spec card */}
        <section className="rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              <PenLine className="size-4" /> Stitch specification
            </h3>
            <div className="flex items-center gap-3">
              <SourceBadge source={pack.stitching.source} />
              <div className="w-36">
                <ConfidenceBar value={pack.stitching.confidence} />
              </div>
            </div>
          </div>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Primary stitch", pack.stitching.primary_stitch],
                ["Stitches per inch", pack.stitching.spi_text],
                ["Seam allowance", pack.stitching.seam_allowance_text],
                ["Topstitch", pack.stitching.topstitch],
                ["Thread", pack.stitching.thread],
                ["Needle", pack.stitching.needle],
              ] as Array<[string, string | null | undefined]>
            ).map(([label, value]) =>
              value ? (
                <div key={label} className="border-l-2 border-signal/60 pl-3">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
          {pack.stitching.requires_review ? (
            <p className="mt-5 inline-block rounded-full border border-signal/40 bg-signal/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-signal-deep">
              Review required
            </p>
          ) : null}
        </section>
      </TabsContent>

      <TabsContent value="colorways" className="animate-fade-up">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
            Colourways — split swatch view
          </h3>
          <span className="font-mono text-[10px] text-signal">05 / COLOUR</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {pack.colorways.map((c, i) => (
            <SplitSwatchCard key={c.id} c={c} index={i} />
          ))}
        </div>
      </TabsContent>
    </>
  );
}
