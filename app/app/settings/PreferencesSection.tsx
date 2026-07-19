"use client";

import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { Globe, Palette } from "lucide-react";

export function PreferencesSection() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Appearance</h2>
        </div>
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Language</h2>
        </div>
        <LanguageSwitcher />
      </div>
    </section>
  );
}
