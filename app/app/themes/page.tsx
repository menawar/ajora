"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Palette, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../../hooks/useTheme";
import { Ripple } from "../../components/ui/Ripple";
import { useSFX } from "../../hooks/useSFX";
import { useState, useEffect } from "react";
import { useWallet } from "../../hooks/useWallet";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const THEMES = [
  { id: "light", name: "Classic Light", price: 0, unlocked: true, colors: ["#ffffff", "#f3f4f6", "#35d07f"] },
  { id: "dark", name: "Celo Dark", price: 0, unlocked: true, colors: ["#0b0c10", "#1a1b26", "#35d07f"] },
  { id: "forest", name: "Deep Forest", price: 500, unlocked: false, colors: ["#f1f8f5", "#e2f0e9", "#2a9d8f"] },
  { id: "ocean", name: "Pacific Ocean", price: 500, unlocked: false, colors: ["#e0fbfc", "#c2dfe3", "#3d5a80"] },
  { id: "sunset", name: "Sahara Sunset", price: 1000, unlocked: false, colors: ["#fff3e0", "#ffe0b2", "#e76f51"] },
  { id: "midnight", name: "Midnight Sky", price: 2000, unlocked: false, colors: ["#0f172a", "#1e293b", "#818cf8"] },
] as const;

export default function ThemesPage() {
  const { theme, setTheme } = useTheme();
  const sfx = useSFX();
  const { address } = useWallet();
  const [xpBalance, setXpBalance] = useState(0);
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(['light', 'dark']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!address) {
      setLoading(false);
      return;
    }
    const fetchThemes = async () => {
      try {
        const res = await fetch(`/api/themes?address=${address}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (active && json) {
          setXpBalance(json.xp_balance || 0);
          setUnlockedThemes(json.unlocked_themes || ['light', 'dark']);
        }
      } catch (e) {
        console.error("API failed", e);
        if (active) {
          setXpBalance(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchThemes();
    return () => { active = false; };
  }, [address]);

  const handleUnlock = async (themeId: string, price: number) => {
    if (!address) return;
    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, themeId, price })
      });
      if (res.ok) {
        setXpBalance(prev => prev - price);
        setUnlockedThemes(prev => [...prev, themeId]);
        sfx.click();
        setTheme(themeId as any);
      } else {
        sfx.pop();
      }
    } catch (e) {
      sfx.pop();
    }
  };

  return (
    <motion.main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="pt-4 flex items-start justify-between">
        <div>
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Settings
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gradient flex items-center gap-3">
            Themes <Palette className="w-6 h-6 text-purple-500" />
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Customize your experience.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-celo-gold bg-celo-gold/10 px-3 py-1.5 rounded-xl border border-celo-gold/20">
            {xpBalance} XP
          </div>
        </div>
      </motion.header>

      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4">
        {THEMES.map((t) => {
          const isSelected = theme === t.id || (theme === "system" && t.id === "light");
          const isUnlocked = t.unlocked || unlockedThemes.includes(t.id);

          return (
            <Ripple key={t.id} className="rounded-2xl h-full" as="div">
              <button
                onClick={() => {
                  if (isUnlocked) {
                    sfx.click();
                    setTheme(t.id as any);
                  } else if (xpBalance >= t.price) {
                    handleUnlock(t.id, t.price);
                  } else {
                    sfx.pop();
                  }
                }}
                className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all h-full flex flex-col ${
                  isSelected 
                    ? "border-celo-green bg-celo-green/5 shadow-[0_0_15px_rgba(53,208,127,0.15)]" 
                    : isUnlocked 
                      ? "border-gray-200 dark:border-gray-800 bg-bg-secondary hover:border-gray-300 dark:hover:border-gray-700"
                      : "border-gray-200 dark:border-gray-800 bg-bg-secondary opacity-50 grayscale"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-celo-green" />
                  </div>
                )}
                
                <div className="flex gap-1 mb-3">
                  {t.colors.map((c, i) => (
                    <div 
                      key={i} 
                      className="w-5 h-5 rounded-full shadow-sm border border-black/10" 
                      style={{ backgroundColor: c }} 
                    />
                  ))}
                </div>

                <div className="mt-auto">
                  <h3 className={`font-bold text-sm ${isSelected ? "text-celo-green" : "text-text-primary"}`}>
                    {t.name}
                  </h3>
                  
                  {!t.unlocked && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-bold text-text-muted">
                      <Lock className="w-3 h-3" /> {t.price} XP
                    </div>
                  )}
                </div>
              </button>
            </Ripple>
          );
        })}
      </motion.section>
    </motion.main>
  );
}
