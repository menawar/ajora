"use client";

import { useTranslation, locales, localeNames, type Locale } from "../lib/i18n";

/** Compact language picker — a native <select> for zero JS weight and free a11y. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();
  return (
    <label className={`inline-flex items-center gap-1 text-xs text-gray-500 ${className}`}>
      <span className="sr-only">{t("language.label")}</span>
      <span aria-hidden>🌐</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("language.label")}
        className="bg-transparent font-medium text-gray-700 outline-none"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
