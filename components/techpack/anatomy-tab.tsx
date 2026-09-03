import { TabsContent } from "@/components/ui/tabs";
import type { Project } from "@/lib/schemas/tech-pack";
import type { CoreComponent, UDimension, URequirement, AssemblyOperation, ManufacturingRequirement } from "@/lib/schemas/universal";

interface UniversalLike {
  components?: CoreComponent[];
  dimensions?: UDimension[];
  requirements?: URequirement[];
  assembly_sequence?: AssemblyOperation[];
  manufacturing?: ManufacturingRequirement[];
  visuals_plan?: { id: string; type: string; generation: string; status: string; purpose?: string; asset_path?: string }[];
}

function Tag({ children, tone = "signal" }: { children: React.ReactNode; tone?: "signal" | "ink" | "emerald" | "red" }) {
  const cls =
    tone === "signal"
      ? "border-signal/30 bg-signal/10 text-signal-deep"
      : tone === "emerald"
        ? "border-[#0c9358]/30 bg-[#0c9358]/10 text-[#0c9358]"
        : tone === "red"
          ? "border-[#bc3838]/30 bg-[#bc3838]/10 text-[#bc3838]"
          : "border-ink/15 bg-paper text-ink";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {children}
    </span>
  );
}

function SourceLabel({ source }: { source?: string }) {
  if (!source) return null;
  const pretty = String(source).replace(/_/g, " ");
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
      {pretty}
    </span>
  );
}

export function AnatomyTab({ project }: { project: Project }) {
  const u = (project.universal as UniversalLike | null) ?? null;
  const comps = u?.components ?? [];
  const dims = u?.dimensions ?? [];
  const ops = u?.assembly_sequence ?? [];
  const mfg = u?.manufacturing ?? [];

  return (
    <TabsContent value="anatomy" className="animate-fade-up space-y-6">
      <div className="border border-ink/15 bg-sheet p-5 shadow-sheet">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
            Product anatomy — components
          </h2>
          <span className="font-mono text-[10px] text-ink-soft">{comps.length} components</span>
        </div>

        {comps.length === 0 ? (
          <p className="text-sm text-ink-soft">Not provided — no components were identified.</p>
        ) : (
          <ol className="space-y-3">
            {comps.map((c) => (
              <li key={c.id} className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg border border-ink/20 bg-sheet font-mono text-xs font-semibold">
                    {String(comps.indexOf(c) + 1).padStart(2, "0")}
                  </span>
                  <p className="font-display text-base font-semibold">{c.name}</p>
                  <Tag tone="ink">{c.type}</Tag>
                  <Tag>{c.confidence}</Tag>
                  {c.parent_id ? <Tag tone="ink">of {c.parent_id}</Tag> : null}
                  {c.status === "REQUIRES_CONFIRMATION" ? <Tag tone="red">review</Tag> : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                  {c.function ? <span>Function: {c.function}</span> : null}
                  {c.material_ref ? <span>Material: {c.material_ref}</span> : null}
                  <SourceLabel source={c.source} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {dims
                    .filter((d) => d.reference_component === c.id)
                    .map((d) => (
                      <span key={`${c.id}-${d.id}`} className="rounded-md border border-ink/10 bg-sheet px-1.5 py-0.5 font-mono text-[9px] text-ink">
                        {d.name} {d.value?.nominal}{d.unit}
                      </span>
                    ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-ink/15 bg-sheet p-5 shadow-sheet">
          <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
            Assembly sequence — {ops.length} operations
          </h2>
          {ops.length === 0 ? (
            <p className="text-sm text-ink-soft">No assembly operations defined.</p>
          ) : (
            <ol className="space-y-2">
              {ops.map((op) => (
                <li key={op.id} className="flex items-start gap-3 border-l-2 border-signal/40 pl-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-signal-deep">
                        {op.step}. {op.operation.replace(/_/g, " ")}
                      </span>
                      {op.machine ? <span className="font-mono text-[9px] text-ink-soft">{op.machine}</span> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-ink">{op.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="border border-ink/15 bg-sheet p-5 shadow-sheet">
          <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
            Manufacturing requirements — {mfg.length}
          </h2>
          {mfg.length === 0 ? (
            <p className="text-sm text-ink-soft">Not provided.</p>
          ) : (
            <ul className="space-y-2">
              {mfg.map((m) => (
                <li key={m.id} className="rounded-lg border border-ink/10 bg-paper/60 p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono font-semibold uppercase tracking-[0.1em]">{m.process}</span>
                    {m.machine ? <span className="text-ink-soft">{m.machine}</span> : null}
                    {m.tool ? <span className="text-ink-soft">tool: {m.tool}</span> : null}
                  </div>
                  {m.parameter ? <p className="mt-1 text-ink-soft">Parameter: {m.parameter}</p> : null}
                  {m.operator_instruction ? <p className="mt-1 text-ink">{m.operator_instruction}</p> : null}
                  {m.inspection ? <p className="mt-1 text-ink-soft">Inspection: {m.inspection}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border border-ink/15 bg-sheet p-5 shadow-sheet">
        <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
          Visual asset plan — {u?.visuals_plan?.length ?? 0}
        </h2>
        {!u?.visuals_plan?.length ? (
          <p className="text-sm text-ink-soft">Not provided.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {u.visuals_plan.map((v) => (
              <li key={v.id} className="rounded-lg border border-ink/10 bg-paper/60 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em]">
                    {v.type.replace(/_/g, " ")}
                  </span>
                  <Tag tone={v.status === "GENERATED" ? "emerald" : v.status === "PLANNED" ? "signal" : "ink"}>
                    {v.status}
                  </Tag>
                </div>
                {v.purpose ? <p className="mt-1 text-xs text-ink-soft">{v.purpose}</p> : null}
                <p className="mt-1 font-mono text-[9px] uppercase text-ink-soft">{v.generation}</p>
                {v.asset_path ? (
                  <img
                    src={v.asset_path}
                    alt={`${v.type.replace(/_/g, " ")} render`}
                    className="mt-2 aspect-[4/3] w-full rounded-md border border-ink/10 bg-white object-contain"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </TabsContent>
  );
}
