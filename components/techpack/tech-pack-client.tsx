"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { visualAssetPending } from "@/lib/ai/visual-prompt";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QaPanel } from "@/components/techpack/qa-panel";
import { ReadinessPanel } from "@/components/techpack/readiness-panel";
import { WorkspaceModeControl, type WorkspaceMode } from "@/components/techpack/workspace-mode";
import { PdfPreview } from "@/components/techpack/pdf-preview";
import { ExportButtons } from "@/components/techpack/export-buttons";
import { impactForFields } from "@/lib/impact";
import { formatDateTime } from "@/lib/format";
import { useLocale } from "@/components/i18n/locale-provider";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { OverviewTab } from "@/components/techpack/overview-tab";
import { IllustrationsTab } from "@/components/techpack/illustrations-tab";
import { AnatomyTab } from "@/components/techpack/anatomy-tab";
import { BomTab } from "@/components/techpack/bom-tab";
import { MeasurementsTab } from "@/components/techpack/measurements-tab";
import { ConstructionColorwaysTab } from "@/components/techpack/construction-colorways-tab";
import { QcTab } from "@/components/techpack/qc-tab";
import { AssumptionsTab } from "@/components/techpack/assumptions-tab";
import { RequirementsTab } from "@/components/techpack/requirements-tab";
import type {
  PatchFn,
} from "@/components/techpack/types";
import type {
  Project,
  QaReport,
  Revision,
} from "@/lib/schemas/tech-pack";

const RENDER_POLL_MS = 6000;

const TABS = [
  { value: "overview", labelKey: "tabs.overview", num: "01", desc: "Product identity, image, summary and stitching at a glance" },
  { value: "illustrations", labelKey: "tabs.illustrations", num: "02", desc: "Flat sketches, construction guide, material swatches and size chart visuals" },
  { value: "anatomy", labelKey: "tabs.anatomy", num: "03", desc: "Component breakdown, assembly sequence, manufacturing requirements and visual asset plan" },
  { value: "bom", labelKey: "tabs.bom", num: "04", desc: "Bill of materials with cut components, consumption and fabric specs" },
  { value: "measurements", labelKey: "tabs.measurements", num: "05", desc: "POM grading across sizes with tolerances and measurement points" },
  { value: "construction", labelKey: "tabs.construction", num: "06", desc: "Assembly sequence, seams and construction detail" },
  { value: "colorways", labelKey: "tabs.colorways", num: "07", desc: "Colourway combinations, swatches and pairings" },
  { value: "quality", labelKey: "tabs.quality", num: "08", desc: "Inspection checklist per checkpoint and stage" },
  { value: "labels", labelKey: "tabs.labels", num: "09", desc: "Brand/care labels and packing specification" },
  { value: "requirements", labelKey: "tabs.requirements", num: "10", desc: "Traceable requirements matrix with categories, priorities and verification methods" },
  { value: "assumptions", labelKey: "tabs.assumptions", num: "11", desc: "AI assumption register, QA warnings and revision history" },
];

function Stamp({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "signal" | "ink" | "green";
}) {
  const tones = {
    signal: "border-signal text-signal",
    ink: "border-ink/60 text-ink",
    green: "border-emerald-700 text-emerald-700",
  };
  return (
    <span
      className={`stamp inline-flex -rotate-2 items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function TechPackClient({
  project: initialProject,
  revisions: initialRevisions,
}: {
  project: Project;
  revisions: Revision[];
}) {
  const [project, setProject] = useState(initialProject);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<WorkspaceMode>("editor");
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState("overview");
  const [impact, setImpact] = useState<{ modules: string[]; tabs: string[] } | null>(null);

  const projectId = project.id;
  const refreshProject = useCallback(async () => {
    const res = await fetch(`/api/tech-pack/${projectId}`);
    if (!res.ok) return;
    const data = (await res.json()) as { project: Project; revisions: Revision[] };
    startTransition(() => {
      setProject(data.project);
      setRevisions(data.revisions);
    });
  }, [projectId, startTransition]);

  // AI-render watcher: while any visual asset is still missing its image
  // (queued, failed or a legacy GENERATED-without-path), re-fetch the project
  // periodically so finished renders appear without a manual refresh.
  const visualsPlan = project.universal?.visuals_plan ?? [];
  const anyRenderPending = visualsPlan.some(
    (v) => v.generation === "GENERATIVE" && visualAssetPending(v)
  );
  useEffect(() => {
    if (!anyRenderPending) return;
    const timer = setInterval(refreshProject, RENDER_POLL_MS);
    return () => clearInterval(timer);
  }, [anyRenderPending, refreshProject]);

  const onPatch: PatchFn = useCallback(
    async (patches) => {
      setError(null);
      const res = await fetch(`/api/tech-pack/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patches }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
          issues?: unknown;
        } | null;
        setError(
          body?.error ??
            `Update failed (${res.status}). Check the value and try again.`
        );
        return;
      }
      const data = (await res.json()) as {
        project: Project;
        qaReport: QaReport;
        revisions: Revision[];
      };
      setImpact(impactForFields(patches.map((p) => p.field)));
      startTransition(() => {
        setProject(data.project);
        setRevisions(data.revisions);
      });
    },
    [projectId, startTransition]
  );

  const pack = project.tech_pack;
  if (!pack) return null;

  const blocking = project.qa_report?.blocking_errors?.length ?? 0;
  const generated = formatDateTime(pack.generated_at);

  return (
    <div className="min-h-screen bg-paper bg-grain text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-sheet/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full border border-ink/20 bg-sheet hover:border-signal/50 hover:bg-secondary"
          >
            <Link href="/" aria-label="Back to home">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.26em] text-ink-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/masdr-logo-purple.png" alt="MASDR" className="inline h-4 w-auto" />
              {t("dash.eyebrow")}
              {pack.product.brand ? ` — ${pack.product.brand}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="truncate font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                {pack.product.name}
              </h1>
              <span className="rounded-full border border-ink/20 bg-paper px-2 py-0.5 font-mono text-[11px] font-semibold">
                {pack.version}
              </span>
              <Stamp tone="signal">{t("dash.badge.ai")}</Stamp>
              {pack.review_status === "APPROVED" ? (
                <Stamp tone="green">{t("dash.badge.approved")}</Stamp>
              ) : (
                <Stamp tone="ink">{t("dash.badge.review")}</Stamp>
              )}
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-ink-soft">
              {t("dash.generated")} {generated} · {t("dash.humanEdits")}
            </p>
            <LocaleToggle className="mt-2" />
          </div>
          <div className="flex items-center gap-3">
            <WorkspaceModeControl mode={mode} onChange={setMode} />
            <ExportButtons project={project} />
          </div>
        </div>
        {blocking > 0 ? (
          <div className="border-t border-[#9e8dff]/40 bg-[#bbb9f9]/30 px-6 py-2 font-mono text-xs font-medium text-signal-deep">
            {blocking} blocking issue{blocking > 1 ? "s" : ""} flagged — export stays available;
            resolve these before sending the pack to a factory.
          </div>
        ) : null}
      </header>

      {error ? (
        <div className="mx-6 mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <main
        className={
          mode === "pdf"
            ? "mx-auto max-w-7xl px-6 py-8"
            : "mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_340px]"
        }
      >
        <div className={cn("min-w-0", mode === "split" && "lg:col-span-1")}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className={cn("gap-6", mode === "pdf" && "hidden")}>
              <div className="flex flex-col gap-3">
                <TabsList
                  variant="default"
                  className="flex w-full flex-wrap justify-start gap-1.5 rounded-full border border-ink/10 bg-sheet/90 p-1.5 shadow-sheet backdrop-blur-sm"
                >
                  {TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="group flex-1 basis-[120px] gap-2 rounded-full border border-transparent px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-ink/15 hover:bg-secondary/60 hover:text-ink data-[state=active]:border-transparent data-[state=active]:bg-signal data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_0_rgb(109_74_255/0.45)]"
                    >
                      <span className="text-[9px] font-semibold text-signal group-data-[state=active]:text-white/70">
                        {tab.num}
                      </span>
                      <span className="font-bold uppercase leading-tight">{t(tab.labelKey)}</span>
                      {tab.value === "assumptions" && blocking > 0 ? (
                        <span className="ml-auto inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-signal text-[10px] font-bold text-sheet group-data-[state=active]:bg-white/20">
                          {blocking}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 px-1 pb-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-signal-deep">
                      {TABS.find((t) => t.value === activeTab)?.num ?? "01"} / {TABS.length}
                    </span>
                    <h2 className="font-heading text-xl font-semibold text-ink">
                      {t(TABS.find((x) => x.value === activeTab)?.labelKey ?? "tabs.overview")}
                    </h2>
                  </div>
                  <p className="hidden text-xs text-ink-soft md:block">
                    {TABS.find((t) => t.value === activeTab)?.desc}
                  </p>
                </div>

                {impact ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-signal/30 bg-signal/10 px-4 py-3">
                    <p className="text-xs text-ink">
                      <span className="mr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-deep">
                        Change impact §37
                      </span>
                      Affected:{" "}
                      {impact.modules.map((m, i) => (
                        <span key={m} className="font-medium">
                          {m}
                          {i < impact.modules.length - 1 ? ", " : ""}
                        </span>
                      ))}
                      {impact.tabs.length > 0 ? (
                        <span className="ml-2 text-ink-soft">
                          · due for review:
                          {impact.tabs.map((ti) => (
                            <button
                              key={ti}
                              type="button"
                              onClick={() => setActiveTab(ti)}
                              className="ml-1 font-mono text-[10px] font-semibold uppercase underline decoration-signal/40 underline-offset-2 hover:text-signal-deep"
                            >
                              {t(TABS.find((x) => x.value === ti)?.labelKey ?? ti)}
                            </button>
                          ))}
                        </span>
                      ) : null}
                    </p>
                    <button
                      type="button"
                      onClick={() => setImpact(null)}
                      className="rounded-full border border-ink/15 px-2 py-0.5 font-mono text-[10px] uppercase text-ink-soft hover:border-signal/40 hover:text-ink"
                    >
                      dismiss
                    </button>
                  </div>
                ) : null}
              </div>

            <OverviewTab project={project} />
            <IllustrationsTab project={project} />
            <AnatomyTab project={project} />
            <BomTab project={project} onPatch={onPatch} />
            <MeasurementsTab project={project} onPatch={onPatch} />
            <ConstructionColorwaysTab project={project} />
            <QcTab project={project} />
            <RequirementsTab project={project} />
            <AssumptionsTab project={project} revisions={revisions} />
          </Tabs>
        </div>

        {mode !== "editor" ? (
          <div className={mode === "split" ? "lg:sticky lg:top-6 lg:self-start" : ""}>
            <PdfPreview project={project} />
          </div>
        ) : null}

        <div
          className={cn(
            "space-y-4 lg:sticky lg:top-6 lg:self-start",
            mode !== "editor" && "lg:col-start-1"
          )}
        >
          {pending ? (
            <p className="flex items-center gap-2 rounded-full border border-[#9e8dff]/40 bg-[#bbb9f9]/25 px-4 py-2 font-mono text-xs text-signal-deep">
              <Loader2 className="size-3.5 animate-spin" /> {t("dash.pending")}
            </p>
          ) : null}
          <QaPanel project={project} />
          <ReadinessPanel project={project} onApproved={refreshProject} />
          <p className="rounded-[24px] border border-ink/10 bg-sheet p-4 font-mono text-[11px] leading-relaxed text-ink-soft shadow-sheet">
            Values marked{" "}
            <span className="font-semibold text-violet-700">inferred</span> or{" "}
            <span className="font-semibold text-signal-deep">assumed</span> are AI
            estimates. Edit any of them; your changes are versioned and logged.
          </p>
        </div>
      </main>
    </div>
  );
}
