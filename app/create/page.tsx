import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateForm } from "@/components/create/create-form";
import { LottieAnim } from "@/components/landing/primitives";
import { LocaleToggle } from "@/components/i18n/locale-toggle";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-paper bg-grain text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-sheet/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/masdr-logo-purple.png" alt="MASDR" className="h-8 w-auto" />
            <div className="hidden border-l border-ink/15 pl-3 leading-none sm:block">
              <p className="font-heading text-sm font-semibold tracking-tight">
                AI Tech Pack Generator
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Spec sheet engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LottieAnim
              src="/lottie/spool-spin.json"
              className="hidden size-9 sm:block"
            />
            <LocaleToggle />
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/15 bg-sheet px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-signal/40 hover:text-signal-deep"
            >
              <ArrowLeft className="size-3.5" />
              Home
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <CreateForm />
      </div>
    </main>
  );
}
