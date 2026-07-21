"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { CountUp } from "./CountUp";

interface CrewGoalProgressProps {
  current: number;
  target: number;
  label?: string;
}

export function CrewGoalProgress({ current, target, label = "Daily Crew Goal" }: CrewGoalProgressProps) {
  const progress = Math.min((current / target) * 100, 100);
  const isComplete = progress >= 100;

  return (
    <div className="glass-panel rounded-3xl p-5 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
      {/* Background glow if complete */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute inset-0 bg-celo-green blur-3xl pointer-events-none"
        />
      )}

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isComplete ? "bg-celo-green text-white" : "bg-bg-secondary text-text-muted"}`}>
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-text-primary">{label}</h3>
        </div>
        <div className="text-right">
          <span className="font-black text-xl text-text-primary">
            <CountUp to={current} duration={1500} />
          </span>
          <span className="text-text-muted font-medium text-sm"> / {target} cUSD</span>
        </div>
      </div>

      <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden relative z-10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, type: "spring", stiffness: 100, damping: 20 }}
          className={`h-full rounded-full ${isComplete ? "bg-celo-gold" : "bg-celo-green"}`}
        />
      </div>

      <div className="mt-2 text-xs font-medium text-text-secondary text-center relative z-10">
        {isComplete ? (
          <span className="text-celo-gold font-bold">🎉 Goal crushed! Crew multiplier active.</span>
        ) : (
          <span>Save <span className="font-bold text-text-primary">{target - current} cUSD</span> more to unlock the crew bonus!</span>
        )}
      </div>
    </div>
  );
}
