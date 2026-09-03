"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Project } from "@/lib/schemas/tech-pack";
import type { PdfMode } from "@/lib/pdf/build-pdf";

/**
 * Live PDF preview: rebuilds the pdfmake document whenever the project
 * (version) changes and renders it in an embedded viewer.
 */
export function PdfPreview({ project }: { project: Project }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PdfMode>("technical");
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const { buildPdfBlobUrl } = await import("@/lib/pdf/build-pdf");
        const next = await buildPdfBlobUrl(project, mode);
        if (cancelled) {
          URL.revokeObjectURL(next);
          return;
        }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = next;
        setUrl(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not render PDF preview.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project, mode]);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-ink/10 bg-sheet shadow-sheet">
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-paper px-4 py-2.5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
          Live PDF preview
        </p>
        <div className="flex items-center gap-3">
          <select
            aria-label="PDF mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as PdfMode)}
            className="h-7 rounded-full border border-ink/20 bg-sheet px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft outline-none focus:border-signal"
          >
            <option value="technical">Technical</option>
            <option value="buyer">Buyer</option>
            <option value="factory">Factory</option>
          </select>
          <span className="font-mono text-[10px] text-signal">
            {project.tech_pack?.version ?? "—"}
          </span>
        </div>
      </div>
      <div className="min-h-[420px] flex-1 bg-blueprint-fine">
        {error ? (
          <p className="p-6 font-mono text-xs text-destructive">{error}</p>
        ) : url ? (
          <iframe
            key={url}
            src={url}
            title="Tech pack PDF preview"
            className="size-full min-h-[420px]"
          />
        ) : (
          <p className="flex items-center gap-2 p-6 font-mono text-xs text-ink-soft">
            <Loader2 className="size-3.5 animate-spin" /> Rendering PDF…
          </p>
        )}
      </div>
    </div>
  );
}
