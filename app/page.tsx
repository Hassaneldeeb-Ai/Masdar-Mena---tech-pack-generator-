import { Hero } from "@/components/landing/hero";
import { StatsStrip } from "@/components/landing/stats-strip";
import { Workflow } from "@/components/landing/workflow";
import { Categories } from "@/components/landing/categories";
import { InsidePack } from "@/components/landing/inside-pack";
import { Provenance } from "@/components/landing/provenance";
import { QaGate } from "@/components/landing/qa-gate";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export default function Landing() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Hero />
      <StatsStrip />
      <Workflow />
      <Categories />
      <InsidePack />
      <Provenance />
      <QaGate />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}
