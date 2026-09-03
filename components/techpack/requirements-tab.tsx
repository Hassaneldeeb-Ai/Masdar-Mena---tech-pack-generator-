import { TabsContent } from "@/components/ui/tabs";
import type { Project } from "@/lib/schemas/tech-pack";
import type { URequirement } from "@/lib/schemas/universal";

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "PASS"
      ? "border-[#0c9358]/30 bg-[#0c9358]/10 text-[#0c9358]"
      : status === "WARNING" || status === "REVIEW"
        ? "border-signal/30 bg-signal/10 text-signal-deep"
        : status === "FAIL"
          ? "border-[#bc3838]/30 bg-[#bc3838]/10 text-[#bc3838]"
          : "border-ink/15 bg-paper text-ink-soft";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function RequirementsTab({ project }: { project: Project }) {
  const reqs: URequirement[] = (project.universal as { requirements?: URequirement[] } | null)?.requirements ?? [];

  return (
    <TabsContent value="requirements" className="animate-fade-up space-y-6">
      <div className="border border-ink/15 bg-sheet shadow-sheet">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 px-5 py-4">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
            Requirements matrix
          </h2>
          <span className="font-mono text-[10px] text-ink-soft">
            {reqs.filter((r) => r.status === "PASS").length}/{reqs.length} passing
          </span>
        </div>
        {reqs.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft">Not provided — no requirements defined.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-ink bg-paper font-mono text-[9px] uppercase tracking-[0.16em] text-ink-soft">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Requirement</th>
                  <th className="px-4 py-2.5">Target</th>
                  <th className="px-4 py-2.5">Pri.</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Verification</th>
                  <th className="px-4 py-2.5">Traceability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {reqs.map((r) => {
                  const tr = r.traceability ?? {};
                  const trace = [
                    ...(tr.component_ids ?? []),
                    ...(tr.dimension_ids ?? []),
                    ...(tr.qc_ids ?? []),
                  ];
                  return (
                    <tr key={r.id} className="align-top hover:bg-secondary/40">
                      <td className="px-4 py-2.5 font-mono font-semibold">{r.id}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                        {r.category.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2.5">{r.statement}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px]">
                        {r.target ? (
                          <>
                            {r.target}
                            {r.tolerance != null ? ` ±${r.tolerance}` : ""}
                          </>
                        ) : r.tolerance != null ? (
                          `${r.tolerance}`
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] font-semibold">{r.priority}</td>
                      <td className="px-4 py-2.5">
                        <StatusChip status={r.status} />
                      </td>
                      <td className="px-4 py-2.5 text-ink-soft">{r.verification_method ?? "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-ink-soft">
                        {trace.length > 0 ? trace.join(", ") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TabsContent>
  );
}