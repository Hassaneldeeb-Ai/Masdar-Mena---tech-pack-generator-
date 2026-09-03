"use client";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";

const columns = [
  {
    titleKey: "footer.product",
    links: [
      { labelKey: "nav.create", href: "/create" },
      { labelKey: "nav.demo", href: "/#demo" },
      { labelKey: "nav.how", href: "/#how" },
      { labelKey: "nav.inside", href: "/#pack" },
    ],
  },
  {
    titleKey: "footer.assurance",
    links: [
      { labelKey: "nav.provenance", href: "/#provenance" },
      { labelKey: "nav.qa", href: "/#qa" },
      { labelKey: "nav.faq", href: "/#faq" },
    ],
  },
];

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="bg-[var(--masdr-night)] text-white">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/masdr-logo-white.png"
              alt="MASDR"
              className="h-9 w-auto"
            />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              {t("footer.desc")}
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.titleKey} aria-label={t(col.titleKey)}>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--masdr-lav)]">
                {t(col.titleKey)}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.labelKey}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/65 transition-colors hover:text-white"
                    >
                      {t(l.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
            © {new Date().getFullYear()} Masdr — AI Tech Pack Generator
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
            AI-generated output · ready for technical review
          </p>
        </div>
      </div>
    </footer>
  );
}
