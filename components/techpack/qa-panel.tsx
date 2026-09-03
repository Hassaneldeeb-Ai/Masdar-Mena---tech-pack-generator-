import type { Project } from "@/lib/schemas/tech-pack";
import { useLocale } from "@/components/i18n/locale-provider";

function QaGauge({ pct }: { pct: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;
  const tone = pct >= 90 ? "var(--signal)" : pct >= 60 ? "var(--ink)" : "#bc3838";

  return (
    <div className="relative mx-auto size-[132px]">
      <svg viewBox="0 0 132 132" className="size-full -rotate-90">
        <circle
          cx="66"
          cy="66"
          r={R}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth="6"
        />
        <circle
          cx="66"
          cy="66"
          r={R}
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="butt"
          strokeDasharray={`${dash} ${C}`}
          className="animate-gauge"
          style={{ ["--gauge-circ" as string]: C }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-mono text-3xl font-semibold leading-none tracking-tight">
            {pct}
            <span className="text-sm text-ink-soft">%</span>
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">
            complete
          </p>
        </div>
      </div>
    </div>
  );
}

export function QaPanel({ project }: { project: Project }) {
  const { t } = useLocale();
  const qa = project.qa_report;
  if (!qa) return null;
  const pct = qa.completeness_pct;

  return (
    <aside className="space-y-6 rounded-[24px] border border-ink/10 bg-sheet p-5 shadow-sheet">
      <div className="border-b border-dashed border-ink/20 pb-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
            {t("qa.completeness")}
          </h3>
          <span aria-hidden className="size-1.5 animate-blink rounded-full bg-signal shadow-[0_0_8px_0_rgb(109_74_255/0.8)]" />
        </div>
        <QaGauge pct={pct} />
        <p className="mt-3 text-center font-mono text-[11px] text-ink-soft">
          {qa.checks_passed}/{qa.checks_total} {t("qa.checks")}
        </p>
      </div>

      <div className="space-y-3">
        {qa.blocking_errors.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-destructive">
              {t("qa.blocking")} ({qa.blocking_errors.length})
            </p>
            {qa.blocking_errors.map((e, i) => (
              <div key={i} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-2.5">
                <p className="text-xs font-medium text-destructive">{e.message}</p>
                {e.guidance && (
                  <p className="mt-1 font-mono text-[10px] leading-relaxed text-destructive/80">
                    {e.guidance}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {qa.warnings.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-signal-deep">
              {t("qa.warnings")} ({qa.warnings.length})
            </p>
            {qa.warnings.map((e, i) => (
              <div
                key={i}
                className="rounded-2xl border border-signal/40 bg-signal/5 p-2.5"
              >
                <p className="text-xs font-medium text-ink">{e.message}</p>
                {e.guidance && (
                  <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-soft">
                    {e.guidance}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
            {t("qa.info")} ({qa.info.length})
          </p>
          {qa.info.map((e, i) => (
            <div key={i} className="rounded-2xl border border-ink/15 bg-paper p-2.5">
              <p className="text-xs text-ink-soft">{e.message}</p>
            </div>
          ))}
        </div>
        {qa.recommendations.length > 0 && (
          <div className="space-y-1.5 border-t border-dashed border-ink/20 pt-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              {t("qa.recommendations")}
            </p>
            {qa.recommendations.filter(
              (r: unknown) => typeof r === "string" || (r && typeof (r as { message?: unknown }).message === "string")
            ).map((r, i) => {
              const text = typeof r === "string" ? r : (r as { message: string }).message;
              return (
                <p key={i} className="text-xs leading-relaxed text-ink-soft">
                  <span className="mr-1.5 font-mono text-signal">→</span>
                  {text}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
