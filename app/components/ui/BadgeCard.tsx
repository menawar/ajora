"use client";

import { motion } from "framer-motion";
import type { Achievement } from "../../data/achievements";
import { Lock } from "lucide-react";
import { Ripple } from "./Ripple";
import { TiltCard } from "./TiltCard";
import { useSFX } from "../../hooks/useSFX";

interface BadgeCardProps {
  achievement: Achievement;
  onClick?: () => void;
  index?: number;
}

const TIER_COLORS = {
  bronze: "from-[#cd7f32] to-[#8c5a24]",
  silver: "from-[#e2e2e2] to-[#a0a0a0]",
  gold: "from-[#fbcc5c] to-[#d4a017]",
  diamond: "from-[#b9f2ff] to-[#5cb3ff]",
};

export function BadgeCard({ achievement, onClick, index = 0 }: BadgeCardProps) {
  const isUnlocked = achievement.unlockedAt !== null;
  const sfx = useSFX();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
    >
      <TiltCard>
        <Ripple>
          <div 
            onClick={() => {
              if (onClick) onClick();
              if (isUnlocked) sfx.pop();
            }}
            className={`relative overflow-hidden rounded-2xl p-4 flex flex-col items-center text-center border-2 transition-all cursor-pointer h-full ${
              isUnlocked 
                ? "bg-bg-secondary border-transparent hover:border-gray-200 dark:hover:border-gray-700" 
                : "bg-bg-primary border-dashed border-gray-200 dark:border-gray-800 opacity-60 grayscale hover:grayscale-0"
            }`}
          >
            {/* Background Glow for unlocked items */}
            {isUnlocked && (
              <div className={`absolute inset-0 bg-gradient-to-br ${TIER_COLORS[achievement.tier]} opacity-10 blur-xl pointer-events-none`} />
            )}

            <div className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-inner mb-3 ${
              isUnlocked ? `bg-gradient-to-br ${TIER_COLORS[achievement.tier]}` : "bg-gray-200 dark:bg-gray-800"
            }`}>
              {isUnlocked ? (
                <span className="text-3xl drop-shadow-md">{achievement.icon}</span>
              ) : (
                <Lock className="w-6 h-6 text-text-muted" />
              )}
            </div>

            <h3 className="font-bold text-sm text-text-primary mb-1 tracking-tight line-clamp-1">{achievement.title}</h3>
            
            <p className="text-[10px] font-medium text-text-secondary line-clamp-2 leading-tight mb-2">
              {achievement.description}
            </p>

            <div className="mt-auto w-full">
              {isUnlocked ? (
                <span className="text-[9px] font-bold text-celo-green uppercase tracking-widest bg-celo-green/10 px-2 py-1 rounded-md">
                  Unlocked
                </span>
              ) : achievement.progress ? (
                <div className="w-full">
                  <div className="flex justify-between text-[9px] font-bold text-text-muted uppercase mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress.current}/{achievement.progress.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-celo-gold rounded-full" 
                      style={{ width: `${(achievement.progress.current / achievement.progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                  Locked
                </span>
              )}
            </div>
          </div>
        </Ripple>
      </TiltCard>
    </motion.div>
  );
}
