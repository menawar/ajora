// i18n scaffolding (#90). English is the source of truth for the key set; every
// other locale mirrors its shape (enforced by the `Dictionary` type). Pidgin and
// Swahili ship first — the primary MiniPay audiences. Add keys to `en`, then fill
// each locale; a missing key falls back to English at lookup time.

export const locales = ["en", "pcm", "sw"] as const;
export type Locale = (typeof locales)[number];

/** Endonyms for the language switcher. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  pcm: "Pidgin",
  sw: "Kiswahili",
};

export const en = {
  "nav.home": "Home",
  "nav.save": "Save",
  "nav.pick": "Pick",
  "nav.draw": "Draw",
  "nav.crew": "Crew",
  "nav.wallet": "Wallet",
  "home.tagline": "Save small, keep every cent, win the daily draw.",
  "language.label": "Language",
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;

/** Nigerian Pidgin. Nav verbs read fine in English for this audience; copy is localized. */
export const pcm: Dictionary = {
  "nav.home": "Home",
  "nav.save": "Save",
  "nav.pick": "Pick",
  "nav.draw": "Draw",
  "nav.crew": "Crew",
  "nav.wallet": "Wallet",
  "home.tagline": "Save small small, keep your money, win the daily draw.",
  "language.label": "Language",
};

export const sw: Dictionary = {
  "nav.home": "Nyumbani",
  "nav.save": "Weka",
  "nav.pick": "Chagua",
  "nav.draw": "Bahati",
  "nav.crew": "Kikundi",
  "nav.wallet": "Pochi",
  "home.tagline": "Weka kidogo, tunza kila senti, shinda bahati ya kila siku.",
  "language.label": "Lugha",
};

export const dictionaries: Record<Locale, Dictionary> = { en, pcm, sw };
