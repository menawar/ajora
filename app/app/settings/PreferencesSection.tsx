"use client";

import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { PushToggle } from "../../components/PushToggle";
import { Globe, Palette, Bell } from "lucide-react";
import { SettingsGroup } from "../../components/ui/SettingsGroup";
import { ToggleItem } from "../../components/ui/ToggleItem";

export function PreferencesSection() {
  return (
    <SettingsGroup title="Preferences" delay={0.2}>
      <ToggleItem
        icon={<Palette className="w-5 h-5" />}
        title="Appearance"
        description="Dark or Light mode"
        action={<ThemeToggle />}
      />
      <ToggleItem
        icon={<Globe className="w-5 h-5" />}
        title="Language"
        description="Choose your app language"
        action={<LanguageSwitcher />}
      />
      <ToggleItem
        icon={<Bell className="w-5 h-5" />}
        title="Notifications"
        description="Draw results & daily reminders"
        action={<PushToggle />}
        borderBottom={false}
      />
    </SettingsGroup>
  );
}
