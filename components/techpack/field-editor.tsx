"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { FieldValue, Source } from "@/lib/schemas/tech-pack";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PatchFn = (patches: { field: string; value: unknown; reason?: string }[]) => Promise<void>;

const SOURCE_LABELS: Record<Source, string> = {
  observed: "Observed (image)",
  inferred: "AI inferred",
  assumed: "Assumed",
  user_provided: "User provided",
  verified: "Verified",
};

const sourceBadge: Record<Source, string> = {
  observed: "border-sky-700/30 bg-sky-50 text-sky-800",
  inferred: "border-[#9e8dff]/50 bg-[#bbb9f9]/30 text-[#5f50bc]",
  assumed: "border-signal/40 bg-signal/10 text-signal-deep",
  user_provided: "border-emerald-700/30 bg-emerald-50 text-emerald-800",
  verified: "border-[#5f50bc]/30 bg-[#bbb9f9] text-[#5f50bc]",
};

export function SourceBadge({ source }: { source: Source }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${sourceBadge[source]}`}
    >
      {source}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-ink/15">
        <div className="h-full rounded-full bg-gradient-to-r from-signal to-[#9e8dff]" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-ink-soft">{pct}%</span>
    </div>
  );
}

export function FieldValueView({
  fieldPath,
  value: fv,
  label,
  onPatch,
}: {
  fieldPath: string;
  value: FieldValue;
  label: string;
  onPatch: PatchFn;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(fv.value);
  const [source, setSource] = useState<Source>(fv.source);
  const [reason, setReason] = useState("");

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-3 transition-colors hover:border-signal/40">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">{label}</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{fv.value}</p>
        <Button size="icon-sm" variant="ghost" className="rounded-full hover:bg-signal/10 hover:text-signal" onClick={() => setOpen(true)} aria-label={`Edit ${label}`}>
          <Pencil />
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <SourceBadge source={fv.source} />
        <ConfidenceBar value={fv.confidence} />
      </div>
      {fv.note && <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-ink-soft">{fv.note}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[24px] border-ink/15">
          <DialogHeader>
            <DialogTitle>
              {label} <span className="text-xs text-stone-400">— override</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{label}</Label>
              <Input value={val} onChange={(e) => setVal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as Source)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SOURCE_LABELS) as Source[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (recorded in revision log)</Label>
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Confirmed with supplier sample"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">Cancel</Button>
            </DialogClose>
            <Button
              className="rounded-full bg-signal text-white shadow-[0_0_18px_0_rgb(109_74_255/0.4)] hover:bg-[var(--masdr-purple)]"
              onClick={async () => {
                const changed = val !== fv.value || source !== fv.source;
                if (val.trim() === "" || (!changed && reason.trim() === "")) {
                  setOpen(false);
                  return;
                }
                await onPatch([
                  {
                    field: fieldPath,
                    value: {
                      value: val,
                      source,
                      confidence: source === "verified" || source === "user_provided" ? 1 : fv.confidence,
                      requires_review: source === "verified" || source === "user_provided" ? false : true,
                      note: fv.note,
                    },
                    reason: reason || undefined,
                  },
                ]);
                setOpen(false);
                setReason("");
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
