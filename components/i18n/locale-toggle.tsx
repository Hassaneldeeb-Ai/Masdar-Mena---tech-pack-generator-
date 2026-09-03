"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { Locale } from "@/lib/i18n";

export function LocaleToggle({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const next: Locale = locale === "en" ? "ar" : "en";
  const base = "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors";
  const tone = dark
    ? "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
    : "border-ink/20 text-ink-soft hover:border-signal hover:text-signal-deep";
  return (
    <button
      type="button"
      className={`${base} ${tone} ${className}`}
      aria-label="Switch language"
      onClick={() => setLocale(next)}
    >
      <Languages className="size-3" />
      {t("common.en")}
      <span className="opacity-40">/</span>
      <span className={locale === "ar" ? "text-signal" : ""}>{t("common.ar")}</span>
    </button>
  );
}
