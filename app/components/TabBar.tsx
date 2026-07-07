"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "../lib/i18n";
import type { TranslationKey } from "../lib/i18n/dictionaries";

const tabs = [
  { href: "/", labelKey: "nav.home", icon: "🏠" },
  { href: "/save", labelKey: "nav.save", icon: "💰" },
  { href: "/pick", labelKey: "nav.pick", icon: "🎯" },
  { href: "/draw", labelKey: "nav.draw", icon: "🎰" },
  { href: "/crew", labelKey: "nav.crew", icon: "🫂" },
  { href: "/wallet", labelKey: "nav.wallet", icon: "👛" },
] as const satisfies ReadonlyArray<{ href: string; labelKey: TranslationKey; icon: string }>;

/** Fixed bottom navigation — one-thumb reach on small phones. */
export function TabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                active ? "font-semibold text-celo-green" : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
