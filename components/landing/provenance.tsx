import { Eye, BrainCircuit, CircleAlert, UserRound, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/landing/primitives";

/* The exact five provenance states defined in lib/schemas/tech-pack.ts. */
const sources = [
  {
    icon: Eye,
    name: "Observed",
    chip: "bg-[#BBB9F9] text-[#5F50BC]",
    body: "Read directly from the uploaded image — visible construction, colours, structure.",
  },
  {
    icon: BrainCircuit,
    name: "Inferred",
    chip: "bg-[#e9e9f5] text-[var(--signal-deep)]",
    body: "Derived by manufacturing logic from what was observed — graded from what the camera can see.",
  },
  {
    icon: CircleAlert,
    name: "Assumed",
    chip: "bg-[#fdeee2] text-[#b4550f]",
    body: "A fill-in the model chose. Surfaced for review instead of passing as fact.",
  },
  {
    icon: UserRound,
    name: "User provided",
    chip: "bg-[#dceee6] text-[#0C9358]",
    body: "Taken from your brief — brand, quantity, sizes, colour intent.",
  },
  {
    icon: BadgeCheck,
    name: "Verified",
    chip: "bg-[#BBB9F9] text-[#5F50BC]",
    body: "Confirmed by you in the editor before export.",
  },
];

export function Provenance() {
  return (
    <section id="provenance" className="scroll-mt-20 border-b border-ink/10 bg-[#f7f7fb] bg-grain">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--signal-deep)]">
              Provenance
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.015em] text-balance sm:text-4xl lg:text-[2.9rem]">
              Generated, not guessed
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Every field in the pack carries its source and a confidence
              score. Unsupported assumptions are surfaced for review — never
              presented as manufacturing truth.
            </p>
          </div>
        </Reveal>

        <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {sources.map((s, i) => (
            <li key={s.name} className="relative">
              <Reveal delay={i * 100} className="h-full">
                <div className="flex h-full flex-col rounded-[24px] border border-ink/10 bg-sheet p-6 shadow-sheet transition-shadow duration-400 hover:shadow-sheet-lg">
                  <div className="flex items-center justify-between">
                    <span className={`grid size-9 place-items-center rounded-full ${s.chip}`}>
                      <s.icon className="size-4.5" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="font-mono text-[10px] text-ink-soft/60">
                      {String(i + 1).padStart(2, "0")}/05
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold tracking-[-0.01em]">
                    {s.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
