import { Reveal } from "@/components/landing/primitives";

const stats = [
  { value: "28", label: "Automated QA checks on every pack" },
  { value: "5", label: "Provenance states behind each field" },
  { value: "12", label: "Specification sections, fully editable" },
  { value: "2", label: "Export formats — PDF + JSON" },
];

export function StatsStrip() {
  return (
    <section className="bg-paper bg-blueprint" aria-label="Key numbers">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-6 py-14 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.value} delay={i * 90}>
            <div className="flex flex-col items-center gap-2 px-4 py-4 text-center">
              <span className="font-heading text-5xl font-semibold tracking-[-0.02em] text-[var(--masdr-purple)] lg:text-6xl">
                {s.value}
              </span>
              <span className="max-w-[22ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ink-soft sm:text-[11px]">
                {s.label}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
