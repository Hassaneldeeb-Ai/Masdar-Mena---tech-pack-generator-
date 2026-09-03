"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { UploadZone } from "./upload-zone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LottieAnim } from "@/components/landing/primitives";
import { cn } from "@/lib/utils";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];


const STAGES = [
  { id: "vision", labelKey: "create.stage.vision", done: "Product structure identified" },
  { id: "spec", labelKey: "create.stage.spec", done: "Materials, BOM and measurements created" },
  { id: "qa", labelKey: "create.stage.qa", done: "Checks passed — 4 assumptions detected" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

function SectionTag({ num, titleKey }: { num: string; titleKey: string }) {
  const { t } = useLocale();
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid size-6 place-items-center rounded-full bg-[#bbb9f9] font-mono text-[10px] font-bold text-[#5f50bc]">
        {num}
      </span>
      <Label className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
        {t(titleKey)}
      </Label>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-[#9e8dff]/50 to-transparent" />
    </div>
  );
}

export function CreateForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<StageId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(
    () => description.trim().split(/\s+/).filter(Boolean).length,
    [description]
  );

  const { t } = useLocale();

  function toggleSize(s: string) {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].sort()));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError(t("create.upload.first"));
      return;
    }
    if (sizes.length === 0) {
      setError(t("create.validate.sizes"));
      return;
    }
    setBusy(true);
    setProgress("vision");
    try {
      const form = new FormData();
      form.set("image", file);
      if (backFile) form.set("image_back", backFile);
      form.set("name", name);
      form.set("description", description);
      form.set("brand", brand);
      form.set("quantity", quantity);
      form.set("sizes", JSON.stringify(sizes));

      const createRes = await fetch("/api/projects", { method: "POST", body: form });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => null);
        throw new Error(err?.error ?? "Could not create the project.");
      }
      const { id } = await createRes.json();

      const genRes = await fetch("/api/tech-pack/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });
      if (!genRes.ok || !genRes.body) throw new Error("Generation failed.");

      const reader = genRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let failed: string | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          if (msg.type === "stage") {
            const s = msg.stage as string;
            setProgress(
              s === "vision" || s === "spec" || s === "qa"
                ? (s as StageId)
                : s === "pack" || s === "ready"
                  ? "qa"
                  : (s as StageId)
            );
          }
          if (msg.type === "error") failed = msg.message;
        }
      }
      if (failed) throw new Error(failed);
      // brief pause so the final stage is visible
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/tech-pack/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
      setProgress(null);
    }
  }

  const stageIndex = progress ? STAGES.findIndex((s) => s.id === progress) : -1;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_300px]">
      <form onSubmit={submit} className="animate-fade-up w-full space-y-10">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-signal">
            New document
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Create <span className="italic text-signal">tech pack</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
            Turn a product image and a few details into a factory-ready starting
            specification.
          </p>
        </div>

        <section className="space-y-2">
          <SectionTag num="01" titleKey="create.section1" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                {t("create.front")} <span className="text-[var(--masdr-lav)]">*</span>
              </p>
              <UploadZone onFile={setFile} />
            </div>
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                {t("create.back")} <span className="normal-case text-ink/40">({t("create.back.hint")})</span>
              </p>
              <UploadZone onFile={setBackFile} />
            </div>
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-ink-soft">
            A back photo lets the vision model verify two-sided construction, back
            seams and label placement — noticeably better specs for reversible or
            printed products.
          </p>
        </section>

        <section className="space-y-6">
          <SectionTag num="02" titleKey="create.section2" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("create.name")} *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">{t("create.brand")}</Label>
              <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="description">{t("create.description")} *</Label>
              <span className="font-mono text-[10px] text-ink-soft">{wordCount} words</span>
            </div>
            <Textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product in plain language — what it is, how it should behave, what it is made of."
              required
            />
          </div>
        </section>

        <section className="space-y-5">
          <SectionTag num="03" titleKey="create.section3" />
          <div className="space-y-2">
            <Label>{t("create.sizes.title")}</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => (
                <label
                  key={s}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-mono text-sm transition-all duration-300",
                    sizes.includes(s)
                      ? "border-signal bg-signal text-white shadow-[0_0_16px_0_rgb(109_74_255/0.35)]"
                      : "border-ink/20 bg-sheet hover:border-signal/50 hover:text-signal-deep"
                  )}
                >
                  <Checkbox
                    checked={sizes.includes(s)}
                    onCheckedChange={() => toggleSize(s)}
                    className="size-4"
                  />
                  {s}
                </label>
              ))}
            </div>
            <p className="font-mono text-[10px] leading-relaxed text-ink-soft">
              Colourways are extracted automatically from your product image, with hex
              and the nearest Pantone FHI/TCX reference.
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <SectionTag num="04" titleKey="create.section4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {t("create.quantity")}
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          size="lg"
          className="h-14 w-full rounded-full bg-signal text-base text-white shadow-[0_0_29px_0_rgb(109_74_255/0.45),inset_0_1px_14px_0_rgb(255_255_255/0.35)] transition-all hover:-translate-y-0.5 hover:bg-[var(--masdr-purple)]"
          disabled={busy}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {t("create.submit")}
        </Button>

        <Dialog open={busy} onOpenChange={() => {}}>
          <DialogContent
            showCloseButton={false}
            aria-describedby={undefined}
            className="max-w-md rounded-[24px] border border-ink/15 bg-sheet p-6"
          >
            <LottieAnim
              src="/lottie/spool-spin.json"
              className="pointer-events-none absolute right-5 top-5 size-12 opacity-90"
            />
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-dashed border-ink/20 pb-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-signal text-white shadow-[0_0_18px_0_rgb(109_74_255/0.4)]">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <p className="font-heading text-lg font-semibold tracking-tight">
                    {t("create.dialog.title")}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                    {t("create.dialog.helper")}
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                {STAGES.map((stage, i) => {
                  const active = stageIndex === i;
                  const complete = stageIndex > i;
                  return (
                    <div key={stage.id} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-semibold",
                          complete && "border-signal bg-signal text-white",
                          active && "border-signal text-signal animate-blink",
                          !complete && !active && "border-ink/25 text-ink/30"
                        )}
                      >
                        {complete ? <Check className="size-3.5" /> : i + 1}
                      </span>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            !complete && !active && "text-ink/40"
                          )}
                        >
                          {t(stage.labelKey)}
                          {active && (
                            <Loader2 className="ml-2 inline size-3.5 animate-spin text-signal" />
                          )}
                        </p>
                        {complete && (
                          <p className="mt-0.5 font-mono text-[10px] text-ink-soft">
                            {stage.done}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </form>

      {/* live spec summary rail */}
      <aside className="animate-fade-up h-fit space-y-5 lg:sticky lg:top-6" style={{ ["--d" as string]: "160ms" }}>
        <div className="rounded-[24px] border border-ink/10 bg-sheet p-5 shadow-sheet">
          <div className="mb-4 flex items-center justify-between border-b border-dashed border-ink/20 pb-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              Live spec summary
            </p>
            <span aria-hidden className="size-1.5 animate-blink rounded-full bg-signal shadow-[0_0_8px_0_rgb(109_74_255/0.8)]" />
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                Product
              </dt>
              <span aria-hidden className="leader-dots h-3 min-w-4 flex-1" />
              <dd className="max-w-[60%] truncate text-right text-xs font-medium">
                {name || "—"}
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                Brand
              </dt>
              <span aria-hidden className="leader-dots h-3 min-w-4 flex-1" />
              <dd className="max-w-[60%] truncate text-right text-xs font-medium">
                {brand || "—"}
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                Sizes
              </dt>
              <span aria-hidden className="leader-dots h-3 min-w-4 flex-1" />
              <dd className="text-right font-mono text-xs font-medium">
                {sizes.join(" / ") || "—"}
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                Quantity
              </dt>
              <span aria-hidden className="leader-dots h-3 min-w-4 flex-1" />
              <dd className="text-right font-mono text-xs font-medium">
                {quantity ? `${quantity} units` : "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-dashed border-ink/20 pt-4">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
              Colourways
            </p>
            <p className="font-mono text-[10px] leading-relaxed text-ink/50">
              Extracted automatically from your product image — hex + nearest Pantone FHI/TCX.
            </p>
          </div>
        </div>
        <p className="rounded-[24px] border border-[#9e8dff]/30 bg-[#bbb9f9]/20 p-4 font-mono text-[10px] leading-relaxed text-signal-deep">
          Output: BOM + POM grading + construction + colourways + QA checks.
          Every AI value ships with provenance and confidence metadata.
        </p>
      </aside>
    </div>
  );
}
