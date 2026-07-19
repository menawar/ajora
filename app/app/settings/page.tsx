import { ProfileSection } from "./ProfileSection";
import { PreferencesSection } from "./PreferencesSection";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your Ajora experience</p>
      </header>
      
      <ProfileSection />
      <PreferencesSection />
    </main>
  );
}
