"use client";

import { Package, ShieldCheck, Tag } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import type { Project, TechPack } from "@/lib/schemas/tech-pack";

function SpecTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-ink/10 bg-sheet shadow-sheet">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b-2 border-ink bg-paper font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function QcTab({ project }: { project: Project }) {
  const pack = project.tech_pack as TechPack;

  const categories = Array.from(
    new Set(pack.quality_control.map((qc) => qc.category))
  );

  return (
    <>
      <TabsContent value="quality" className="animate-fade-up space-y-8">
        <section className="rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              <ShieldCheck className="size-4" /> Quality control checklist
            </h3>
            <span className="font-mono text-[10px] text-signal">06 / INSPECTION</span>
          </div>
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
            {categories.map((category, ci) => (
              <div key={category}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-ink font-mono text-[10px] font-bold text-sheet">
                    {ci + 1}
                  </span>
                  <h4 className="text-sm font-semibold tracking-tight">{category}</h4>
                  <span aria-hidden className="h-px flex-1 bg-ink/15" />
                </div>
                <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/15">
                  {pack.quality_control
                    .filter((qc) => qc.category === category)
                    .map((qc, qi) => (
                      <li key={qc.id} className="flex items-start gap-3 px-3 py-2.5">
                        <span
                          aria-hidden
                          className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-ink/40 bg-paper font-mono text-[8px] font-bold text-ink-soft"
                        >
                          {ci + 1}.{qi + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">{qc.check}</p>
                          {qc.method ? (
                            <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-ink-soft">
                              Method — {qc.method}
                            </p>
                          ) : null}
                          {qc.standard ? (
                            <p className="font-mono text-[10px] leading-relaxed text-ink-soft">
                              Standard — {qc.standard}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="labels" className="animate-fade-up space-y-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              <Tag className="size-4" /> Labels & branding
            </h3>
            <span className="font-mono text-[10px] text-signal">07 / TRIMS</span>
          </div>
          <SpecTable headers={["Name", "Type", "Placement", "Content", "Required"]}>
            {pack.labels.map((label, i) => (
              <tr
                key={label.id}
                className="animate-fade-up border-b border-ink/10 last:border-b-0 hover:bg-secondary/40"
                style={{ ["--d" as string]: `${i * 70}ms` }}
              >
                <td className="px-3 py-3 font-medium">{label.name}</td>
                <td className="font-mono text-xs capitalize">{label.type}</td>
                <td className="text-ink-soft">{label.placement ?? "TBD"}</td>
                <td className="max-w-[280px] whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">
                  {label.content ?? "—"}
                </td>
                <td>
                  {label.required ? (
                    <span className="inline-block rounded-full bg-emerald-700 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
                      Required
                    </span>
                  ) : (
                    <span className="inline-block rounded-full border border-ink/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
                      Optional
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </SpecTable>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              <Package className="size-4" /> Packaging
            </h3>
            <span className="font-mono text-[10px] text-signal">08 / PACKING</span>
          </div>
          <SpecTable headers={["Item", "Spec", "Unit", "Quantity", "Notes"]}>
            {pack.packaging.map((item, i) => (
              <tr
                key={item.id}
                className="animate-fade-up border-b border-ink/10 last:border-b-0 hover:bg-secondary/40"
                style={{ ["--d" as string]: `${i * 70}ms` }}
              >
                <td className="px-3 py-3 font-medium">{item.item}</td>
                <td className="text-ink-soft">{item.spec}</td>
                <td className="font-mono text-xs">{item.unit}</td>
                <td className="font-mono text-xs">{String(item.quantity)}</td>
                <td className="text-xs text-ink-soft">{item.notes ?? "—"}</td>
              </tr>
            ))}
          </SpecTable>
        </section>
      </TabsContent>
    </>
  );
}
