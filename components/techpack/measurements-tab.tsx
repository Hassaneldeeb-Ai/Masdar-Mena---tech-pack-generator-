"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type { Measurement, Project } from "@/lib/schemas/tech-pack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SourceBadge, ConfidenceBar } from "./field-editor";
import type { PatchFn } from "./types";

/** Grading delta visualization: proportional bars per size value. */
function GradeBars({ m, sizes }: { m: Measurement; sizes: string[] }) {
  const vals = sizes.map((s) => m.values[s]).filter((v): v is number => typeof v === "number");
  if (vals.length < 2) return null;
  const min = Math.min(...vals);
  const span = Math.max(...vals) - min;
  if (span <= 0) return null;
  const steps = vals.length - 1;
  const step = span / steps;
  const constant = vals.every((v, i) => i === 0 || Math.abs(v - vals[i - 1] - step) < 0.05);
  return (
    <div className="mt-2 flex items-end gap-2" aria-hidden>
      {sizes.map((s) => {
        const v = m.values[s];
        if (typeof v !== "number") return <span key={s} className="h-1 w-10" />;
        const h = 4 + ((v - min) / span) * 18;
        return (
          <span
            key={s}
            className="animate-bar-grow w-10 bg-signal/70"
            style={{ height: `${h}px`, ["--d" as string]: `${sizes.indexOf(s) * 90}ms` }}
          />
        );
      })}
      <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
        {constant ? `grade +${step.toFixed(1)} cm / size` : `grade varies · Δ ${span}`}
      </span>
    </div>
  );
}

export function MeasurementsTab({ project, onPatch }: { project: Project; onPatch: PatchFn }) {
  const pack = project.tech_pack!;
  const sizes = useMemo(() => {
    const s = new Set<string>();
    for (const m of pack.measurements) for (const k of Object.keys(m.values)) s.add(k);
    return (project.sizes?.length ? project.sizes : [...s]).filter((x) => s.has(x) || project.sizes?.includes(x));
  }, [pack.measurements, project.sizes]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, Record<string, string>> | null>(null);

  function beginEdit() {
    const d: Record<string, Record<string, string>> = {};
    for (const m of pack.measurements) {
      d[m.id] = {};
      for (const [k, v] of Object.entries(m.values)) d[m.id][k] = String(v);
    }
    setDraft(d);
    setEditing(true);
  }

  async function save() {
    if (!draft) return;
    const patches: Array<{ field: string; value: unknown; reason?: string }> = [];
    for (const m of pack.measurements) {
      const values: Record<string, number> = {};
      for (const [k, v] of Object.entries(draft[m.id] ?? {})) {
        const n = Number(v);
        if (Number.isFinite(n)) values[k] = n;
      }
      patches.push({
        field: `measurements.${pack.measurements.findIndex((x) => x.id === m.id)}.values`,
        value: values,
        reason: "Measurements adjusted during technical review",
      });
    }
    await onPatch(patches);
    setEditing(false);
    setDraft(null);
  }

  const numberInput = (m: Measurement, size: string) => {
    if (!editing || !draft)
      return (
        <span className="font-mono text-sm font-semibold">
          {m.values[size] ?? "—"}
        </span>
      );
    return (
      <Input
        type="number"
        step="0.1"
        className="mx-auto h-7 w-16 px-1 text-center font-mono text-xs"
        value={draft[m.id]?.[size] ?? ""}
        onChange={(e) =>
          setDraft((prev) => ({
            ...prev!,
            [m.id]: { ...prev![m.id], [size]: e.target.value },
          }))
        }
      />
    );
  };

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl font-mono text-[11px] leading-relaxed text-ink-soft">
          Proposed starting specifications — these are AI-generated and require
          validation against the approved pattern and sample garment.
        </p>
        <div className="flex gap-2">
          {!editing ? (
            <Button size="sm" variant="outline" onClick={beginEdit} className="rounded-full bg-sheet">
              <Pencil />
              Edit measurements
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={save} className="rounded-full bg-signal text-white shadow-[0_0_16px_0_rgb(109_74_255/0.35)] hover:bg-[var(--masdr-purple)]">
                <Check />
                Save all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setDraft(null);
                }}
                className="rounded-full"
              >
                <X />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-ink/10 bg-sheet shadow-sheet">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink bg-paper font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft sm:first:rounded-tl-[24px] sm:last:rounded-tr-[24px]">
              <th className="px-3 py-2.5 font-medium">POM</th>
              <th className="px-3 py-2.5 font-medium">Description</th>
              {sizes.map((s) => (
                <th key={s} className="px-3 py-2.5 text-center font-semibold text-ink">
                  {s}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-medium">Tolerance</th>
              <th className="px-3 py-2.5 text-right font-medium">Unit</th>
            </tr>
          </thead>
          <tbody>
            {pack.measurements.map((m, i) => (
              <tr
                key={m.id}
                className="animate-fade-up border-b border-ink/10 align-top transition-colors last:border-b-0 hover:bg-secondary/40"
                style={{ ["--d" as string]: `${i * 70}ms` }}
              >
                <td className="px-3 py-3">
                  <span className="inline-grid size-7 place-items-center rounded-full border border-ink/25 bg-paper font-mono text-xs font-bold">
                    {m.id}
                  </span>
                </td>
                <td className="max-w-md px-3 py-3">
                  <p className="font-medium">{m.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {m.how_to_measure}
                  </p>
                  {editing ? null : (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <SourceBadge source={m.source} />
                      <ConfidenceBar value={m.confidence} />
                      {m.requires_review && (
                        <span className="rounded-full border border-signal/40 bg-signal/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-signal-deep">
                          review required
                        </span>
                      )}
                    </div>
                  )}
                  {editing ? null : <GradeBars m={m} sizes={sizes} />}
                </td>
                {sizes.map((s) => (
                  <td key={s} className="px-3 py-3 text-center">
                    {numberInput(m, s)}
                  </td>
                ))}
                <td className="px-3 py-3 text-right font-mono text-xs text-ink-soft">{m.tolerance}</td>
                <td className="px-3 py-3 text-right font-mono text-xs text-ink-soft">{m.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
