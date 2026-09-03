"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Truck } from "lucide-react";
import type { SupplierInfo } from "@/lib/schemas/tech-pack";
import type { PatchFn } from "@/components/techpack/types";

interface Props {
  onPatch: PatchFn;
  fieldPath: string;
  supplier?: SupplierInfo;
}

const EMPTY: Omit<SupplierInfo, "approval_status"> = {
  name: "",
  material_code: "",
  country: "",
  moq: "",
  lead_time_days: "",
  price: "",
  currency: "",
  certification: "",
  contact: "",
};

const STATUS_OPTIONS = ["UNVERIFIED", "PENDING", "APPROVED", "REJECTED"] as const;

export function SupplierAdder({ onPatch, fieldPath, supplier }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Omit<SupplierInfo, "approval_status">>(
    supplier ? { ...EMPTY, ...supplier } : EMPTY
  );
  const [status, setStatus] = useState<SupplierInfo["approval_status"]>(
    supplier?.approval_status ?? "UNVERIFIED"
  );

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const value: SupplierInfo = { ...form, name: form.name.trim(), approval_status: status };
      await onPatch([
        {
          field: fieldPath,
          value,
          reason: "Supplier details entered during technical review.",
        },
      ]);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 rounded-full border-ink/20 bg-sheet px-2.5 font-mono text-[10px]
          font-semibold uppercase tracking-[0.08em] text-ink-soft hover:border-signal/50 hover:text-signal-deep"
        onClick={() => setOpen(true)}
      >
        <Truck className="size-3" />
        {supplier ? "Edit supplier" : "Add supplier"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{supplier ? "Edit supplier" : "Add supplier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-1 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                Supplier name *
              </Label>
              <Input value={form.name} onChange={set("name")} placeholder="e.g. Al-Ahram Textiles Co." />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                Material code
              </Label>
              <Input value={form.material_code} onChange={set("material_code")} placeholder="e.g. AAT-COT-DR1" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                Country
              </Label>
              <Input value={form.country} onChange={set("country")} placeholder="e.g. Egypt" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">MOQ</Label>
              <Input value={form.moq} onChange={set("moq")} placeholder="e.g. 500 m" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                Lead time (days)
              </Label>
              <Input value={form.lead_time_days} onChange={set("lead_time_days")} placeholder="e.g. 14" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                Price
              </Label>
              <Input value={form.price} onChange={set("price")} placeholder="e.g. 6.50" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Currency</Label>
              <Input value={form.currency} onChange={set("currency")} placeholder="EUR" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                Certification
              </Label>
              <Input value={form.certification} onChange={set("certification")} placeholder="e.g. OEKO-TEX 100" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Contact</Label>
              <Input value={form.contact} onChange={set("contact")} placeholder="e.g. sales@example.com" />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                Approval status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SupplierInfo["approval_status"])}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={busy || !form.name.trim()} onClick={save}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
