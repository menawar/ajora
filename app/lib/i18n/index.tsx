"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dictionaries,
  en,
  locales,
  type Locale,
  type TranslationKey,
} from "./dictionaries";

export { locales, localeNames, type Locale } from "./dictionaries";

const STORAGE_KEY = "ajora.locale";

function isLocale(v: string | null): v is Locale {
  return v !== null && (locales as readonly string[]).includes(v);
}

/** Stored choice wins; otherwise a coarse match on the browser language. */
function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const nav = navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("sw")) return "sw";
  // Nigerian Pidgin has no reliable BCP-47 tag in browsers; default to English.
  return "en";
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start at "en" so the server and first client render agree; resolve the real
  // locale after mount to avoid a hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const resolved = detectLocale();
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* private mode / storage disabled — selection still applies this session */
    }
    document.documentElement.lang = l;
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale] ?? en;
    return { locale, setLocale, t: (key) => dict[key] ?? en[key] ?? key };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within <LanguageProvider>");
  return ctx;
}
