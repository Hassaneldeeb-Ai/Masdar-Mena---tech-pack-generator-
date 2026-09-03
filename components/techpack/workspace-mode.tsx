"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export type WorkspaceMode = "editor" | "split" | "pdf";

const MODES: Array<{ id: WorkspaceMode; title: string }> = [
  { id: "editor", title: "Show the techpack editor" },
  { id: "split", title: "Show the editor and live PDF preview together" },
  { id: "pdf", title: "Show the live PDF preview" },
];

export function WorkspaceModeControl({
  mode,
  onChange,
}: {
  mode: WorkspaceMode;
  onChange: (mode: WorkspaceMode) => void;
}) {
  const { t } = useLocale();
  return (
    <div
      aria-label={t("dash.mode")}
      className="inline-flex h-9 items-stretch rounded-full border border-ink/15 bg-paper p-0.5 shadow-sm"
      role="group"
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={mode === m.id}
          data-testid={`workspace-mode-${m.id}`}
          title={m.title}
          onClick={() => onChange(m.id)}
          className={cn(
            "min-w-[3.75rem] rounded-full px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-signal",
            mode === m.id
              ? "bg-signal text-white shadow-[0_0_14px_0_rgb(109_74_255/0.4)]"
              : "text-ink-soft hover:bg-secondary hover:text-ink"
          )}
        >
          {m.id}
        </button>
      ))}
    </div>
  );
}
