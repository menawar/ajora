"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "../lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
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
    <nav className="fixed inset-x-0 bottom-0 border-t border-gray-100 bg-white/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex justify-center pt-2">
          <LanguageSwitcher />
        </div>
        <div className="flex w-full">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-1 flex-col items-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative flex w-full flex-col items-center gap-1 py-3 text-[10px] sm:text-xs transition-colors ${
                    active ? "font-semibold text-celo-green" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 z-0 mx-auto w-12 rounded-full bg-celo-green/10"
                    />
                  )}
                  <motion.div
                    initial={false}
                    animate={{ y: active ? -2 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative z-10 flex flex-col items-center gap-1"
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={active ? 2.5 : 2} />
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
