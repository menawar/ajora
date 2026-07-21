"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "../lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import type { TranslationKey } from "../lib/i18n/dictionaries";
import { Home, PiggyBank, Target, Dices, Users, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import type { ElementType } from "react";

const tabs = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/save", labelKey: "nav.save", icon: PiggyBank },
  { href: "/pick", labelKey: "nav.pick", icon: Target },
  { href: "/draw", labelKey: "nav.draw", icon: Dices },
  { href: "/crew", labelKey: "nav.crew", icon: Users },
  { href: "/wallet", labelKey: "nav.wallet", icon: Wallet },
] as const satisfies ReadonlyArray<{ href: string; labelKey: TranslationKey; icon: ElementType }>;

/** Fixed bottom navigation — one-thumb reach on small phones. */
export function TabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <nav className="fixed inset-x-4 bottom-4 glass-panel rounded-3xl pb-safe z-50">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex justify-center items-center gap-4 pt-2 pb-1">
          <ThemeToggle />
          <LanguageSwitcher direction="up" />
        </div>
        <div className="flex w-full px-2 pb-2">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={t(tab.labelKey)}
                className="relative flex flex-1 flex-col items-center focus-visible:ring-2 focus-visible:ring-celo-green focus-visible:outline-none rounded-xl"
              >
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  className={`relative flex w-full flex-col items-center gap-1 py-2 text-[10px] sm:text-xs transition-colors ${
                    active ? "font-bold text-celo-green" : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 z-0 mx-auto w-12 sm:w-14 rounded-2xl bg-celo-green/10 shadow-[0_0_15px_rgba(53,208,127,0.3)]"
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    />
                  )}
                  <motion.div
                    initial={false}
                    animate={{ y: active ? -6 : 0, scale: active ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 450, damping: 15 }}
                    className="relative z-10 flex flex-col items-center gap-1"
                  >
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 ${active ? "drop-shadow-[0_2px_8px_rgba(53,208,127,0.6)]" : "drop-shadow-sm"}`} strokeWidth={active ? 2.5 : 2} />
                    <span>{t(tab.labelKey)}</span>
                  </motion.div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
