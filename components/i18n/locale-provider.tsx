"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Locale, t as translate } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("masdr-locale")) as Locale | null;
    if (saved === "ar") setLocaleState("ar");
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
      document.body.classList.toggle("font-ar", locale === "ar");
      localStorage.setItem("masdr-locale", locale);
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (key: string) => translate(locale, key) }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
