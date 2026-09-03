"use client";

import { useState } from "react";
import { Loader2, RefreshCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/schemas/tech-pack";
import type { Readiness } from "@/lib/schemas/universal";

function ReadinessGauge({ score }: { score: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;
  const tone = score >= 90 ? "var(--signal)" : score >= 60 ? "var(--ink)" : "#bc3838";
  return (
    <div className="relative mx-auto size-[116px]">
      <svg viewBox="0 0 132 132" className="size-full -rotate-90">
        <circle cx="66" cy="66" r={R} fill="none" stroke="var(--hairline)" strokeWidth="6" />
        <circle
          cx="66"
          cy="66"
          r={R}
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeDasharray={`${dash} ${C}`}
          className="animate-gauge"
          style={{ ["--gauge-circ" as string]: C }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-mono text-[26px] font-semibold leading-none tracking-tight">
            {score}
            <span className="text-xs text-ink-soft">/100</span>
          </p>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ink-soft">
            factory readiness
          </p>
        </div>
      </div>
    </div>
  );
}

function GateRow({ label, value }: { label: string; value: boolean }) {
  const glyph = value ? "✓" : "✕";
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </span>
      <span
        className={`size-4 grid place-items-center rounded-full text-[9px] font-bold ${
          value ? "bg-[#0c9358]/15 text-[#0c9358]" : "bg-[#bc3838]/15 text-[#bc3838]"
        }`}
      >
        {glyph}
      </span>
    </div>
  );
}

export function ReadinessPanel({
  project,
  onApproved,
}: {
  project: Project;
  onApproved?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const readiness = (project.universal as { readiness?: Readiness | null } | null)?.readiness;
  if (!readiness) return null;
  const { factory_ready, sample_ready, stage, approval_status } = readiness;

  const act = async (action: "advance" | "request_change") => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/tech-pack/${project.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setActionError(body?.error ?? "Approval update failed.");
        return;
      }
      if (onApproved) await onApproved();
    } catch {
      setActionError("Approval update failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="rounded-[24px] border border-ink/10 bg-sheet p-5 shadow-sheet">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
        Factory readiness
      </p>
      <div className="mt-3">
        <ReadinessGauge score={factory_ready.score} />
      </div>

      <div className="mt-4 space-y-1.5">
        {factory_ready.dimensions.map((d) => (
          <div key={d.module} className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-ink">{d.module}</span>
            <span className="flex shrink-0 items-center gap-2">
              {d.status === "N_A" ? (
                <span className="font-mono text-[9px] uppercase text-ink-soft">n/a</span>
              ) : (
                <>
                  <span className="h-1 w-14 overflow-hidden rounded-full bg-ink/10">
                    <span
                      className="block h-full rounded-full bg-signal/70"
                      style={{ width: `${d.pct}%` }}
                    />
                  </span>
                  <span className="w-8 text-right font-mono text-[10px] text-ink-soft">
                    {d.pct}%
                  </span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>

      {factory_ready.blockers.length > 0 ? (
        <div className="mt-4 space-y-1 rounded-xl border border-[#bc3838]/20 bg-[#bc3838]/5 p-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#bc3838]">
            Blockers
          </p>
          {factory_ready.blockers.map((b) => (
            <p key={b} className="text-[11px] leading-snug text-ink">
              {b}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-3">
        <GateRow label="Design complete" value={sample_ready.design_complete} />
        <GateRow label="Technically reviewed" value={sample_ready.technically_reviewed} />
        <GateRow label="Sample ready" value={sample_ready.sample_ready} />
        <GateRow label="Production ready" value={sample_ready.production_ready} />
      </div>

      {sample_ready.reasons.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {sample_ready.reasons.map((r) => (
            <li key={r} className="text-[10px] leading-snug text-ink-soft">
              — {r}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
        <span className="rounded-full border border-ink/15 bg-paper px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink">
          {stage}
        </span>
        <span className="rounded-full border border-signal/30 bg-signal/10 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-signal-deep">
          {approval_status}
        </span>
      </div>

      <div className="mt-4 space-y-2 border-t border-ink/10 pt-3">
        <Button
          size="sm"
          className="w-full rounded-full"
          disabled={busy || approval_status === "APPROVED"}
          onClick={() => act("advance")}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
          {approval_status === "APPROVED" ? "Approved" : "Advance approval"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full rounded-full"
          disabled={busy}
          onClick={() => act("request_change")}
        >
          <Undo2 className="size-3.5" /> Request change
        </Button>
        {actionError ? (
          <p className="rounded-lg border border-[#bc3838]/20 bg-[#bc3838]/5 p-2 text-[10px] text-[#bc3838]">
            {actionError}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
