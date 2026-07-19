"use client";

import { motion } from "framer-motion";

export function LevelProgress({ xp, nextLevelXp, level }: { xp: number, nextLevelXp: number, level: number }) {
  const progress = Math.min(100, Math.max(0, (xp / nextLevelXp) * 100));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-gray-900">Level {level}</div>
        <div className="text-sm font-medium text-celo-green">{xp} / {nextLevelXp} XP</div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="h-full bg-celo-green"
          initial={{ width: 0 }}
          animate={{ width: \`\${progress}%\` }}
          transition={{ ease: "easeOut", duration: 1 }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center">
        Save consistently to earn XP and level up!
      </p>
    </div>
  );
}
