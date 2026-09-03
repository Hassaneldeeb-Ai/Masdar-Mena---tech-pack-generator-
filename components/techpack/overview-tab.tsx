import type { Project } from "@/lib/schemas/tech-pack";
import { formatDateTime } from "@/lib/format";
import { SourceBadge, ConfidenceBar } from "./field-editor";

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3 py-2.5">
      <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
        {k}
      </dt>
      <span aria-hidden className="leader-dots h-3 min-w-6 flex-1" />
      <dd className="max-w-[62%] text-right text-sm font-medium">{v}</dd>
    </div>
  );
}

export function OverviewTab({ project }: { project: Project }) {
  const pack = project.tech_pack!;
  const faces = pack.colorways.some((c) => c.face_b) ? "Reversible 2-layer" : "Single layer";
  const sizes = Object.keys(pack.measurements[0]?.values ?? {}).join(" / ");

  const rows: Array<[string, string | undefined]> = [
    ["Product", pack.product.name],
    ["Product code", pack.product.code],
    ["Category", pack.product.category],
    ["Product type", pack.product.product_type?.replace(/_/g, " ")],
    ["Brand", pack.product.brand],
    ["Construction", faces],
    ["Sizes", sizes],
    ["Colourways", pack.colorways.map((c) => c.name).join(" / ")],
    ["Production", pack.product.quantity ? `${pack.product.quantity} units` : "Not specified"],
    ["Intended use", pack.product.intended_use],
    ["Target customer", pack.product.target_customer ?? project.intended_customer],
    ["Revision", pack.version],
    ["Generated", formatDateTime(pack.generated_at)],
  ];

  return (
    <div className="animate-fade-up grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      {/* image frame with dimension lines */}
      <div>
        <div className="relative">
          <div className="absolute -left-3 top-0 bottom-0 hidden items-center justify-center sm:flex">
            <span aria-hidden className="h-full w-px bg-ink/30" />
          </div>
          <div className="absolute inset-x-0 -bottom-3 hidden sm:block">
            <span aria-hidden className="h-px w-full bg-ink/30" />
            <span aria-hidden className="absolute -left-3 -top-1.5 h-3 w-px bg-ink/30" />
            <span aria-hidden className="absolute -right-3 -top-1.5 h-3 w-px bg-ink/30" />
          </div>
          <div className={project.image_back_path ? "grid gap-4 sm:grid-cols-2" : ""}>
            <figure className="relative overflow-hidden rounded-[24px] border border-ink/15 bg-sheet shadow-sheet transition-colors duration-300 hover:border-signal/40">
              <figcaption className="absolute left-3 top-3 z-20 rounded-full bg-ink px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white">
                Front
              </figcaption>
              <div aria-hidden className="pointer-events-none absolute inset-2 z-10">
                <span className="absolute left-0 top-0 size-3 border-l border-t border-ink/40" />
                <span className="absolute right-0 top-0 size-3 border-r border-t border-ink/40" />
                <span className="absolute bottom-0 left-0 size-3 border-b border-l border-ink/40" />
                <span className="absolute bottom-0 right-0 size-3 border-b border-r border-ink/40" />
              </div>
              {project.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.image_path}
                  alt={`${pack.product.name} — front view`}
                  className="aspect-square w-full bg-paper bg-blueprint-fine object-contain"
                />
              ) : (
                <div className="grid aspect-square place-items-center bg-blueprint-fine text-ink-soft">
                  No image
                </div>
              )}
            </figure>
            {project.image_back_path ? (
              <figure className="relative overflow-hidden rounded-[24px] border border-ink/15 bg-sheet shadow-sheet transition-colors duration-300 hover:border-signal/40">
                <figcaption className="absolute left-3 top-3 z-20 rounded-full bg-ink px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white">
                  Back
                </figcaption>
                <div aria-hidden className="pointer-events-none absolute inset-2 z-10">
                  <span className="absolute left-0 top-0 size-3 border-l border-t border-ink/40" />
                  <span className="absolute right-0 top-0 size-3 border-r border-t border-ink/40" />
                  <span className="absolute bottom-0 left-0 size-3 border-b border-l border-ink/40" />
                  <span className="absolute bottom-0 right-0 size-3 border-b border-r border-ink/40" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image_back_path}
                  alt={`${pack.product.name} — back view`}
                  className="aspect-square w-full bg-paper bg-blueprint-fine object-contain"
                />
              </figure>
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <SourceBadge source="inferred" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
            Image analysis — review required
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* key/value spec block */}
        <div className="rounded-[24px] border border-ink/10 bg-sheet p-5 shadow-sheet">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
              Specification summary
            </h3>
            <span className="font-mono text-[10px] text-signal">01 / OVERVIEW</span>
          </div>
          <dl className="divide-y divide-ink/10">
            {rows.map(([k, v]) => (
              <SpecRow key={k} k={k} v={v ?? "—"} />
            ))}
          </dl>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-sheet p-5 shadow-sheet">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
            Buyer description
          </h3>
          <p className="mt-3 whitespace-pre-line border-l-2 border-signal/50 pl-4 text-sm leading-relaxed text-ink-soft">
            {pack.product.description || project.description}
          </p>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-sheet p-5 shadow-sheet">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
            Stitching specification
          </h3>
          <dl className="mt-3 divide-y divide-ink/10 text-sm">
            <div className="flex items-baseline gap-3 py-2.5">
              <dt className="shrink-0 text-ink-soft">Primary stitch</dt>
              <span aria-hidden className="leader-dots h-3 min-w-6 flex-1" />
              <dd className="font-mono text-sm font-semibold">{pack.stitching?.primary_stitch ?? "—"}</dd>
            </div>
            {[
              ["Recommended SPI", pack.stitching?.spi_text],
              ["Seam allowance", pack.stitching?.seam_allowance_text],
              ["Topstitch", pack.stitching?.topstitch],
              ["Thread", pack.stitching?.thread],
            ].map(([k, v]) =>
              v ? (
                <div key={k} className="flex items-baseline gap-3 py-2.5">
                  <dt className="shrink-0 text-ink-soft">{k}</dt>
                  <span aria-hidden className="leader-dots h-3 min-w-6 flex-1" />
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ) : null
            )}
            <div className="flex items-center justify-between gap-2 py-2.5">
              <dt className="text-ink-soft">Provenance</dt>
              <dd className="flex items-center gap-2">
                <SourceBadge source={pack.stitching?.source ?? "inferred"} />
                <ConfidenceBar value={pack.stitching?.confidence ?? 0.5} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
