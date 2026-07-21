"use client";

import { motion } from "framer-motion";
import type { Achievement } from "../hooks/useAchievements";

interface AchievementCardProps {
  achievement: Achievement;
  index?: number;
}

const categoryColor: Record<Achievement["category"], string> = {
  savings: "from-celo-green/20 to-celo-green/5 border-celo-green/20",
  streak:  "from-orange-100/80 to-amber-50/80 border-orange-200/40 dark:from-orange-900/20 dark:to-amber-900/10 dark:border-orange-700/20",
  draw:    "from-purple-100/80 to-indigo-50/80 border-purple-200/40 dark:from-purple-900/20 dark:to-indigo-900/10 dark:border-purple-700/20",
  social:  "from-blue-100/80 to-sky-50/80 border-blue-200/40 dark:from-blue-900/20 dark:to-sky-900/10 dark:border-blue-700/20",
};

const categoryBadge: Record<Achievement["category"], string> = {
  savings: "bg-celo-green/10 text-celo-green",
  streak:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  draw:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  social:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export function AchievementCard({ achievement, index = 0 }: AchievementCardProps) {
  const { unlocked, icon, title, description, category } = achievement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 24 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 transition-all ${
        unlocked
          ? categoryColor[category]
          : "from-gray-50 to-white border-gray-100 dark:from-gray-900 dark:to-gray-800 dark:border-gray-700"
      }`}
    >
      {/* Lock overlay for locked achievements */}
      {!unlocked && (
        <div className="absolute inset-0 bg-bg-primary/40 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
          <span className="text-2xl opacity-30">🔒</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`text-3xl transition-all ${unlocked ? "" : "grayscale opacity-40"}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-bold text-sm text-text-primary truncate">{title}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${categoryBadge[category]}`}>
              {category}
            </span>
            {unlocked && (
              <span className="text-[10px] font-bold text-celo-green ml-auto">✓ Unlocked</span>
            )}
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
