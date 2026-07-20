"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useTranslation, locales, localeNames, type Locale } from "../lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-celo-green"
        aria-label={t("language.label")}
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4 text-gray-500" />
        {localeNames[locale]}
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1" role="none">
              {locales.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLocale(l as Locale);
                    setIsOpen(false);
                  }}
                  className={`group flex w-full items-center justify-between px-4 py-2 text-sm ${
                    locale === l ? "text-celo-green font-semibold bg-celo-green/5" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  role="menuitem"
                >
                  {localeNames[l]}
                  {locale === l && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
