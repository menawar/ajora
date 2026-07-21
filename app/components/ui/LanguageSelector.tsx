"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Globe, X, Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../lib/i18n";
import { localeNames, locales, type Locale } from "../../lib/i18n/dictionaries";
import { Ripple } from "./Ripple";
import { useSFX } from "../../hooks/useSFX";

export function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const sfx = useSFX();

  const handleSelect = (l: Locale) => {
    sfx.click();
    setLocale(l);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => {
          sfx.pop();
          setIsOpen(true);
        }}
        className="flex items-center justify-between w-full p-4 rounded-2xl bg-bg-secondary border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-text-muted" />
          <div className="flex flex-col items-start">
            <span className="font-bold text-sm text-text-primary">{t("language.label")}</span>
            <span className="text-xs font-medium text-text-secondary">{localeNames[locale]}</span>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="relative w-full max-w-sm bg-bg-primary rounded-3xl p-2 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between p-4 pb-2">
                <h2 className="text-lg font-black tracking-tight text-text-primary">{t("language.label")}</h2>
                <button 
                  onClick={() => { sfx.pop(); setIsOpen(false); }}
                  className="p-2 rounded-full bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                {locales.map((l) => (
                  <Ripple key={l} as="div" className="rounded-xl">
                    <button
                      onClick={() => handleSelect(l)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                        locale === l ? "bg-celo-green/10 text-celo-green" : "text-text-primary hover:bg-bg-secondary"
                      }`}
                    >
                      <span className="font-bold text-sm">{localeNames[l]}</span>
                      {locale === l && <Check className="w-4 h-4" />}
                    </button>
                  </Ripple>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
