"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Float, LottieAnim, ParallaxZone } from "@/components/landing/primitives";
import { DemoButton } from "@/components/landing/demo-button";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { useLocale } from "@/components/i18n/locale-provider";

const navLinks = [
  { key: "nav.how", href: "/#how" },
  { key: "nav.inside", href: "/#pack" },
  { key: "nav.provenance", href: "/#provenance" },
  { key: "nav.faq", href: "/#faq" },
];

const demoChips = [
  "Reversible cotton bucket hat",
  "100 units",
  "Sizes S / M / L",
  "Khaki #C3B091",
  "Black #111111",
];

function ThreadCurve({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 120" fill="none" className={className} aria-hidden>
      <path
        d="M4 96 C 70 96, 84 18, 152 24 S 258 92, 316 44"
        stroke="var(--masdr-lav)"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="animate-dash"
        opacity="0.55"
      />
    </svg>
  );
}

function Crosshair({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M12 1H1v11M36 1h11v11M12 47H1V36M36 47h11V36" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 6v8M24 34v8M6 24h8M34 24h8" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

export function Hero() {
  const { t } = useLocale();
  return (
    <section className="p-2 pb-0 sm:p-3 sm:pb-0">
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--masdr-night)] text-white shadow-sheet-lg">
        {/* ——— real brand background + legibility overlays ——— */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/masdr/hero-bg.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover opacity-80"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#080412]/70 via-[#1a1130]/35 to-[#080412]/85"
        />
        <div aria-hidden className="absolute inset-y-0 left-0 w-[14%] bg-gradient-to-r from-[#080412] to-transparent" />
        <div aria-hidden className="absolute inset-y-0 right-0 w-[14%] bg-gradient-to-l from-[#080412] to-transparent" />
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[var(--masdr-purple)] opacity-30 blur-[120px]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/masdr/hero-bottom-glow.png"
          alt=""
          aria-hidden
          className="absolute bottom-0 left-0 w-full"
        />

        {/* ——— overlay header ——— */}
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/masdr-logo-white.png" alt="MASDR" className="h-8 w-auto sm:h-9" />
              <span className="hidden border-l border-white/15 pl-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/55 md:block">
                Tech pack engine
              </span>
            </Link>
            <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60 lg:flex">
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="transition-colors hover:text-[var(--masdr-lav)]">
                  {t(l.key)}
                </Link>
              ))}
              <LocaleToggle dark />
            </nav>
            <Link
              href="/create"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition-colors duration-300 hover:bg-white/20"
            >
              {t("hero.cta")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </header>

        {/* ——— parallax field of floating objects ——— */}
        <ParallaxZone className="absolute inset-0 z-10">
          <Float className="left-[6%] top-[22%] hidden md:block" px={20} driftX={-8} driftY={-14} rot={-8} rot2={4} dur={10}>
            <LottieAnim src="/lottie/needle-swing.json" className="size-28 opacity-90 lg:size-36" />
          </Float>
          <Float className="bottom-[16%] right-[7%] hidden md:block" px={16} driftX={10} driftY={-10} rot={6} rot2={-5} dur={11} delay={600}>
            <LottieAnim src="/lottie/tape-measure.json" className="w-36 opacity-90 lg:w-48" />
          </Float>
          <Float className="right-[10%] top-[24%] hidden lg:block" px={24} driftX={-12} driftY={-18} rot={10} rot2={-8} dur={9} delay={300}>
            <LottieAnim src="/lottie/spool-spin.json" className="size-24 opacity-90" />
          </Float>
          <Float className="bottom-[26%] left-[12%] hidden lg:block" px={12} driftX={8} driftY={-8} dur={12} delay={900}>
            <LottieAnim src="/lottie/stitch-line.json" className="w-44 opacity-80" />
          </Float>
          <Float className="left-[26%] top-[16%]" px={10} driftY={-12} dur={13}>
            <Crosshair className="size-9 text-[var(--masdr-lav)] opacity-40" />
          </Float>
          <Float className="bottom-[30%] right-[26%]" px={10} driftY={-10} dur={12} delay={500}>
            <Crosshair className="size-7 text-white opacity-30" />
          </Float>
          <Float className="left-[18%] top-[46%] hidden sm:block" px={18} driftX={12} driftY={-6} dur={10} delay={200}>
            <ThreadCurve className="w-64 opacity-70" />
          </Float>
          <Float className="bottom-[10%] right-[30%] hidden sm:block" px={8} driftY={-8} dur={14} delay={800}>
            <div className="size-16 rounded-full border border-dashed border-[var(--masdr-lav)]/50 animate-spin-slow" />
          </Float>
        </ParallaxZone>

        {/* ——— content ——— */}
        <div id="demo" className="relative z-20 mx-auto flex min-h-[640px] max-w-4xl scroll-mt-24 flex-col items-center px-5 pb-20 pt-36 text-center sm:px-8 lg:min-h-[86vh] lg:pt-44">
          <p className="animate-fade-up glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/75 sm:text-[11px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/masdr/badge-check.png" alt="" className="size-4" aria-hidden />
            {t("hero.eyebrow2")}
          </p>

          <h1 className="animate-fade-up mt-7 font-heading text-4xl font-semibold leading-[1.06] tracking-[-0.015em] text-balance sm:text-6xl lg:text-[4.2rem]" style={{ ["--d" as string]: "90ms" }}>
            {t("hero.title2.a")}{" "}
            <span className="text-[var(--masdr-lav)]">{t("hero.title2.b")}</span>
          </h1>

          <p className="animate-fade-up mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg" style={{ ["--d" as string]: "170ms" }}>
            {t("hero.sub2")}
          </p>

          {/* ——— glass command panel (Masdr search-bar silhouette) ——— */}
          <div className="animate-fade-up mt-11 w-full max-w-2xl" style={{ ["--d" as string]: "250ms" }}>
            <div className="glass rounded-[32px] p-2.5 sm:rounded-full sm:p-3">
              <div className="flex flex-col items-stretch gap-3 rounded-[26px] bg-[#080412]/45 p-4 sm:flex-row sm:items-center sm:rounded-full sm:py-2 sm:pl-6 sm:pr-2">
                <p className="flex-1 text-left text-sm leading-snug text-white/70 sm:text-[15px]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--masdr-lav)]">
                    {t("hero.describe")}
                  </span>
                  <span className="mt-0.5 block">
                    {t("hero.quote")}
                  </span>
                </p>
                <DemoButton className="sm:flex-col sm:gap-1.5" />
              </div>
            </div>
          </div>

          {/* ——— real demo-project chips ——— */}
          <div className="animate-fade-up mt-7 flex max-w-2xl flex-wrap items-center justify-center gap-2" style={{ ["--d" as string]: "330ms" }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              {t("hero.liverun")}
            </span>
            {demoChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-[0.06em] text-white/60 transition-colors duration-300 hover:bg-white/10 sm:text-[11px]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
