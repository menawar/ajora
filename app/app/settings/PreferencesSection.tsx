"use client";

import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSelector } from "../../components/ui/LanguageSelector";
import { PushToggle } from "../../components/PushToggle";
import { Globe, Palette, Bell, Volume2 } from "lucide-react";
import { SettingsGroup } from "../../components/ui/SettingsGroup";
import { ToggleItem } from "../../components/ui/ToggleItem";
import { useSFX } from "../../hooks/useSFX";

export function PreferencesSection() {
  const sfx = useSFX();
  return (
    <SettingsGroup title="Preferences" delay={0.2}>
      <ToggleItem
        icon={<Palette className="w-5 h-5" />}
        title="Appearance"
        description="Dark or Light mode"
        action={<ThemeToggle />}
      />
      <div className="w-full">
        <LanguageSelector />
      </div>
      <ToggleItem
        icon={<Bell className="w-5 h-5" />}
        title="Notifications"
        description="Draw results & daily reminders"
        action={<PushToggle />}
      />
      <ToggleItem
        icon={<Volume2 className="w-5 h-5" />}
        title="Sound Effects"
        description="In-app audio feedback"
        borderBottom={false}
        action={
          <button
            onClick={sfx.toggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              sfx.enabled ? "bg-celo-green" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                sfx.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        }
      />
    </SettingsGroup>
  );
}
