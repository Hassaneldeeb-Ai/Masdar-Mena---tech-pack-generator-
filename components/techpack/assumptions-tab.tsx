"use client";

import { AlertTriangle, ClipboardList, History } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import type { Project, Revision, TechPack } from "@/lib/schemas/tech-pack";

function SectionHead({
  icon: Icon,
  title,
  tag,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tag: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h3 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
        <Icon className="size-4" /> {title}
      </h3>
      <span className="font-mono text-[10px] text-signal">{tag}</span>
    </div>
  );
}

function LevelMark({ level }: { level: string }) {
  if (level === "blocking") {
    return (
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-destructive font-mono text-[9px] font-bold text-white">
        !
      </span>
    );
  }
  if (level === "warning") {
    return (
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-signal font-mono text-[9px] font-bold text-white">
        !
      </span>
    );
  }
  return (
    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-ink/30 font-mono text-[9px] text-ink-soft">
      i
    </span>
  );
}

export function AssumptionsTab({
  project,
  revisions,
}: {
  project: Project;
  revisions: Revision[];
}) {
  const pack = project.tech_pack as TechPack;
  const qa = project.qa_report;

  return (
    <>
      <TabsContent value="assumptions" className="animate-fade-up space-y-8">
        {/* assumptions ledger */}
        <section className="rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet">
          <SectionHead icon={ClipboardList} title="AI assumptions" tag="09 / PROVENANCE" />
          <p className="mb-4 text-sm leading-relaxed text-ink-soft">
            Every claim the AI could not observe is listed here. Review each one
            before sending this pack to a factory.
          </p>
          <ol className="divide-y divide-ink/10 rounded-2xl border border-signal/30">
            {pack.assumptions.map((assumption, i) => (
              <li
                key={assumption.id}
                className="animate-fade-up flex items-start gap-4 bg-signal/[0.04] px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
                style={{ ["--d" as string]: `${i * 70}ms` }}
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-signal/50 font-mono text-[10px] font-semibold text-signal-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{assumption.statement}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    <span className="rounded-full border border-ink/25 bg-paper px-2 py-0.5 capitalize">
                      {assumption.category}
                    </span>
                    <span>Confidence {Math.round(assumption.confidence * 100)}%</span>
                    <span className="capitalize">Impact: {assumption.impact}</span>
                    {assumption.required_action ? (
                      <span className="text-signal-deep">
                        Action — {assumption.required_action}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* warnings */}
        <section className="rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet">
          <SectionHead icon={AlertTriangle} title="Warnings" tag="10 / QA" />
          <div className="space-y-2">
            {qa && qa.warnings.length > 0 ? (
              qa.warnings.map((warning, i) => (
                <div
                  key={warning.code}
                  className="animate-fade-up flex items-start gap-3 rounded-2xl border border-ink/15 bg-paper px-3 py-2.5"
                  style={{ ["--d" as string]: `${i * 60}ms` }}
                >
                  <LevelMark level={warning.level} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{warning.message}</p>
                    {warning.guidance ? (
                      <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-ink-soft">
                        {warning.guidance}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-soft">No open warnings.</p>
            )}
          </div>
        </section>

        {/* revision ledger */}
        <section className="rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet">
          <SectionHead icon={History} title="Revision log" tag="11 / HISTORY" />
          {revisions.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No human edits recorded yet. Any change you make is logged here.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-ink/15">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-ink bg-paper font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    <th className="px-3 py-2.5 font-medium">Version</th>
                    <th className="px-3 py-2.5 font-medium">Field</th>
                    <th className="px-3 py-2.5 font-medium">Previous</th>
                    <th className="px-3 py-2.5 font-medium">New value</th>
                    <th className="px-3 py-2.5 font-medium">Reason</th>
                    <th className="px-3 py-2.5 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.map((revision, i) => (
                    <tr
                      key={revision.id}
                      className="animate-fade-up border-b border-ink/10 last:border-b-0"
                      style={{ ["--d" as string]: `${i * 60}ms` }}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="rounded-full border border-signal/40 bg-signal/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-signal-deep">
                          {revision.version ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-signal-deep">
                        {revision.field}
                      </td>
                      <td className="max-w-[160px] truncate text-ink-soft">
                        {formatValue(revision.old_value)}
                      </td>
                      <td className="max-w-[160px] truncate font-medium text-ink">
                        {formatValue(revision.new_value)}
                      </td>
                      <td className="text-xs text-ink-soft">{revision.reason ?? "—"}</td>
                      <td className="whitespace-nowrap font-mono text-[10px] text-ink-soft">
                        {formatDateTime(revision.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </TabsContent>
    </>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const maybeValue = value as { value?: unknown };
    if ("value" in maybeValue) return String(maybeValue.value);
    return JSON.stringify(value);
  }
  return String(value);
}
