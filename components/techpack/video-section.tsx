"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VideoSection({
  projectId,
  videoPath,
}: {
  projectId: string;
  videoPath?: string | undefined;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | undefined>(videoPath);
  const router = useRouter();

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tech-pack/${projectId}/video`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Video generation failed.");
        return;
      }
      setLocalUrl(data.videoPath);
      router.refresh();
    } catch {
      setError("Could not reach the video engine.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-signal">
          02.5 / VIDEO
        </span>
        <h3 className="font-display text-lg font-semibold">8-second product showcase</h3>
        <span className="ml-auto font-mono text-[10px] text-ink-soft">VEO 3.1</span>
      </div>
      <p className="mb-4 text-sm text-ink-soft">
        Generated from your reference image as the single source of truth — the product is never
        redesigned, only showcased. No invented features, dimensions or materials.
      </p>

      {localUrl ? (
        <video
          key={localUrl}
          controls
          playsInline
          className="aspect-video w-full rounded-xl border border-ink/10 bg-[#080412]"
          src={localUrl}
          poster={projectId ? undefined : undefined}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ink/20 bg-paper p-8 text-center">
          <Play className="size-8 text-signal" />
          <p className="text-sm text-ink-soft">
            No showcase video yet. It takes about a minute to generate.
          </p>
        </div>
      )}

      {error ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          <AlertTriangle className="size-3.5 shrink-0" /> {error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button
          onClick={generate}
          disabled={busy}
          className="gap-2 rounded-full"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {busy ? "Generating showcase…" : localUrl ? "Regenerate showcase" : "Generate 8s showcase"}
        </Button>
      </div>
    </section>
  );
}
