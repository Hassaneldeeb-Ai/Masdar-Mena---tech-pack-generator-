"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PatchFn } from "./types";

export function MaterialGsmAdder({
  onPatch,
  fieldPath,
  label,
}: {
  onPatch: PatchFn;
  fieldPath: string;
  label: string;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="bg-sheet">
        <Plus />
        {label}
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={1}
        placeholder="e.g. 240"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 max-w-[110px]"
        autoFocus
      />
      <Button
        size="sm"
        onClick={async () => {
          const v = Number(value);
          if (!Number.isFinite(v) || v <= 0) return;
          await onPatch([
            {
              field: fieldPath,
              value: {
                value: String(v),
                source: "user_provided",
                confidence: 1,
                requires_review: false,
                note: "Confirmed weight entered during review.",
              },
              reason: "GSM supplied during technical review",
            },
          ]);
          setOpen(false);
          setValue("");
        }}
      >
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
