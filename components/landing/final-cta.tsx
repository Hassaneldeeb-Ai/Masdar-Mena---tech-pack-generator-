"use client";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { ArrowRight } from "lucide-react";
import { Float, LottieAnim, ParallaxZone } from "@/components/landing/primitives";
import { DemoButton } from "@/components/landing/demo-button";
import { Reveal } from "@/components/landing/primitives";

export function FinalCta() {
  const { t } = useLocale();
  return (
    <section className="p-2 pb-2 sm:p-3 sm:pb-3">
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--masdr-night)] text-white shadow-sheet-lg">
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 h-[380px] w-[680px] -translate-x-1/2 rounded-full bg-[var(--masdr-purple)] opacity-35 blur-[110px]"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        <ParallaxZone className="absolute inset-0">
          <Float className="left-[8%] top-[30%] hidden md:block" px={16} driftY={-14} dur={11}>
            <LottieAnim src="/lottie/spool-spin.json" className="size-20 opacity-80" />
          </Float>
          <Float className="bottom-[18%] right-[9%] hidden md:block" px={12} driftY={-10} dur={12} delay={400}>
            <LottieAnim src="/lottie/stitch-line.json" className="w-40 opacity-70" />
          </Float>
          <Float className="right-[24%] top-[24%]" px={8} driftY={-10} dur={13}>
            <div className="size-12 rounded-full border border-dashed border-[var(--masdr-lav)]/50 animate-spin-slow" />
          </Float>
        </ParallaxZone>

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center lg:py-24">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--masdr-lav)]">
              Ready when you are
            </p>
            <h2 className="mt-4 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.015em] text-balance sm:text-5xl">
              Your next tech pack is one photo away
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-white/65 sm:text-base">
              Run the live demo to see a complete, QA-gated pack in seconds —
              or go straight to the form with your own product.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <DemoButton />
              <Link
                href="/create"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 text-[15px] font-semibold text-white backdrop-blur transition-colors duration-300 hover:border-white/60 hover:bg-white/10"
              >
                Create your own
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Free to run · editable before export · PDF + JSON
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
