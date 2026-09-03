/* eslint-disable @next/next/no-img-element */
import { Reveal } from "@/components/landing/primitives";

const categories = [
  { label: "Clothing", src: "/images/masdr/cat-clothing.png" },
  { label: "Bags", src: "/images/masdr/cat-bags.png" },
  { label: "Footwear", src: "/images/masdr/cat-footwear.png" },
  { label: "Jewellery & accessories", src: "/images/masdr/cat-jewellery.png" },
  { label: "Packaging", src: "/images/masdr/cat-packaging.png" },
  { label: "Home & living", src: "/images/masdr/cat-home.png" },
  { label: "Industrial", src: "/images/masdr/cat-industrial.png" },
  { label: "Furniture", src: "/images/masdr/cat-furniture.png" },
  { label: "Personal care & beauty", src: "/images/masdr/cat-personal-care.png" },
];

export function Categories() {
  return (
    <section className="border-b border-ink/10 bg-paper bg-grain">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <Reveal>
          <div className="mb-12 max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--signal-deep)]">
              Coverage
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.015em] text-balance sm:text-4xl lg:text-[2.9rem]">
              Built for the products factories actually make
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              The vision analysis adapts its specification template to the
              product category — a bucket hat and an aluminium chair need very
              different sections.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {categories.map((c, i) => (
            <Reveal
              key={c.label}
              delay={i * 60}
              className={i === 0 ? "col-span-2 sm:col-span-1" : undefined}
            >
              <div className="group relative h-full overflow-hidden rounded-[24px] bg-[#F2F2F2] p-3 transition-all duration-400 hover:border hover:border-black/10">
                <div className="aspect-square overflow-hidden rounded-2xl">
                  <img
                    src={c.src}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-400 group-hover:scale-110"
                  />
                </div>
                <p className="mt-3 px-1 pb-1 text-sm font-semibold leading-snug text-[#232b32]">
                  {c.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
