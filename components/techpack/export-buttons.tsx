"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/schemas/tech-pack";
import type { PdfMode } from "@/lib/pdf/build-pdf";

export function ExportButtons({ project }: { project: Project }) {
  const router = useRouter();
  const [mode, setMode] = useState<PdfMode>("technical");
  const blocked = (project.qa_report?.blocking_errors?.length ?? 0) > 0;

  async function exportPdf() {
    const { buildPdf } = await import("@/lib/pdf/build-pdf");
    buildPdf(project, mode);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="PDF mode"
        value={mode}
        onChange={(e) => setMode(e.target.value as PdfMode)}
        className="h-9 rounded-full border border-ink/20 bg-sheet px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft outline-none focus:border-signal"
      >
        <option value="technical">Technical pack</option>
        <option value="buyer">Buyer presentation</option>
        <option value="factory">Factory copy</option>
      </select>
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => router.push(`/api/tech-pack/${project.id}/export`)}
        title={blocked ? "Export with open blocking issues — review the QA panel" : "Download JSON"}
      >
        <Download />
        JSON
      </Button>
      <Button
        className="rounded-full bg-signal text-white shadow-[0_0_20px_0_rgb(109_74_255/0.4),inset_0_1px_10px_0_rgb(255_255_255/0.3)] hover:bg-[var(--masdr-purple)]"
        onClick={exportPdf}
        title={blocked ? "Export with open blocking issues — review the QA panel" : "Download PDF"}
      >
        <Download />
        Export PDF
      </Button>
    </div>
  );
}
