import type { Project } from "@/lib/schemas/tech-pack";
import { VideoSection } from "@/components/techpack/video-section";
import { AiVisuals } from "@/components/techpack/ai-visuals";
import { ImageIcon, Loader2 } from "lucide-react";

interface PlanAsset {
  id: string;
  type: string;
  status: string;
  asset_path?: string;
}

function assetById(project: Project, id: string): PlanAsset | undefined {
  return (project.universal?.visuals_plan ?? []).find((v) => v.id === id);
}

function QueuedPane({ label }: { label: string }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-white">
      {label === "failed" ? (
        <>
          <ImageIcon className="size-6 text-red-400" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-red-600">AI render failed</span>
        </>
      ) : (
        <>
          <Loader2 className="size-6 animate-spin text-signal" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">AI render queued</span>
        </>
      )}
    </div>
  );
}

function Figure({
  asset,
  caption,
  fallbackLabel,
}: {
  asset: PlanAsset | undefined;
  caption: string;
  fallbackLabel?: string;
}) {
  const failed = asset?.status === "FAILED";
  const pending = !asset?.asset_path;
  return (
    <figure className="group overflow-hidden rounded-[24px] border border-ink/10 bg-sheet shadow-sheet transition-colors duration-300 hover:border-signal/40">
      {asset?.asset_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.asset_path} alt={caption} className="w-full bg-white object-contain" />
      ) : (
        <QueuedPane label={failed ? "failed" : (fallbackLabel ?? "queued")} />
      )}
      <figcaption className="flex items-center justify-between gap-2 border-t border-ink/10 bg-paper px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-soft">
        <span>{caption}</span>
        {asset?.asset_path ? <span className="text-signal">AI render</span> : null}
      </figcaption>
    </figure>
  );
}

export function IllustrationsTab({ project }: { project: Project }) {
  const pack = project.tech_pack!;
  const front = assetById(project, "va-front");
  const back = assetById(project, "va-back");
  const guide = assetById(project, "va-construction");
  const chart = assetById(project, "va-sizechart");
  const care = assetById(project, "va-care");
  const board = assetById(project, "va-materials");

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <span className="rounded-full bg-[#bbb9f9] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5f50bc]">
            02 / Illustrations
          </span>
          <h3 className="font-heading text-lg font-semibold">Technical renders</h3>
          <p className="ml-auto hidden font-mono text-[10px] text-ink-soft md:block">
            AI-generated from your reference image + POM data
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Figure asset={front} caption="FIG. 1 — front technical render" />
          <Figure asset={back} caption="FIG. 2 — back technical render" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal">02.1 / ASSEMBLY</span>
          <h3 className="font-heading text-lg font-semibold">Construction guide</h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Figure asset={guide} caption="FIG. 3 — construction guide · numbered callouts" />
          <div className="rounded-[24px] border border-ink/10 bg-sheet p-5 shadow-sheet">
            <h4 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-soft">Zone key</h4>
            <ol className="space-y-2.5">
              {pack.construction.flatMap((s) => s.items).slice(0, 6).map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-signal font-mono text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-snug text-ink/90">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {board || pack.materials.length > 0 ? (
        <section>
          <div className="mb-3 flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal">02.2 / MATERIALS</span>
            <h3 className="font-heading text-lg font-semibold">Material board</h3>
          </div>
          <Figure asset={board} caption="FIG. 4 — material board · every BOM line rendered" />
          <div className="mt-3 flex flex-wrap gap-2">
            {pack.materials.map((m) => (
              <span
                key={m.id}
                className="rounded-full border border-ink/15 bg-sheet px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft"
              >
                {m.name} · {m.type}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal">02.3 / SIZING</span>
          <h3 className="font-heading text-lg font-semibold">Size grading</h3>
        </div>
        <div className="mx-auto max-w-2xl">
          <Figure asset={chart} caption="size chart · graduated per POM with grade deltas" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal">02.4 / CARE</span>
          <h3 className="font-heading text-lg font-semibold">Care &amp; compliance</h3>
        </div>
        <div className="max-w-2xl">
          <Figure asset={care} caption="care instruction render · symbols per pack data" />
        </div>
      </section>

      <VideoSection projectId={project.id} videoPath={project.video_path} />

      <AiVisuals project={project} />
    </div>
  );
}
