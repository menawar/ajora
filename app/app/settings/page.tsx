"use client";

import { motion } from "framer-motion";
import { ProfileSection } from "./ProfileSection";
import { PreferencesSection } from "./PreferencesSection";
import { LogOut, Info } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary">
      <header className="text-center pt-2 pb-2">
        <h1 className="text-3xl font-black tracking-tight text-text-primary text-gradient">Settings</h1>
      </header>
      
      <ProfileSection />
      
      <PreferencesSection />
      
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
        className="flex flex-col gap-3 mt-4"
      >
        <button
          className="flex items-center justify-center gap-2 w-full rounded-2xl bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors p-4 font-bold active:scale-95"
        >
          <Info className="w-4 h-4" /> About Ajora v1.0
        </button>

        <button
          className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-red-100 dark:border-red-900/30 text-red-500 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-4 font-bold active:scale-95"
        >
          <LogOut className="w-4 h-4" /> Disconnect Wallet
        </button>
      </motion.section>
    </main>
  );
}
