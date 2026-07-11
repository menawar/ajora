"use client";

import { ShareButtons } from "./ShareButtons";
import { useCrew } from "../hooks/useCrew";
import { useStreak } from "../hooks/useStreak";
import { useWallet } from "../hooks/useWallet";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

const MILESTONES = [7, 30, 90];

function multiplierLabel(x10: bigint): string {
  return `${(Number(x10) / 10).toFixed(1).replace(/\.0$/, "")}x`;
}

/** Streak flame + multiplier, with the one-tap daily check-in. */
export function StreakChip() {
  const { address } = useWallet();
  const { streakDays, multiplierX10, checkedInToday, checkIn, checkingIn, loading } = useStreak();
  const { myCode } = useCrew();

  if (!address || loading) return null;

  const days = Number(streakDays);
  const hitMilestone = MILESTONES.includes(days);

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-2 glass-panel rounded-2xl p-3 shadow-sm"
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
        <span className="text-gray-800">
          <strong>{streakDays.toString()}</strong>-day streak ·{" "}
          <strong>{multiplierLabel(multiplierX10)}</strong> tickets
        </span>
        {!checkedInToday && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => void checkIn()}
            disabled={checkingIn}
            className="ml-2 rounded-full bg-celo-gold/30 px-3 py-1 text-xs font-semibold text-amber-800 disabled:opacity-50"
          >
            {checkingIn ? "Checking in…" : "Check in ✓"}
          </motion.button>
        )}
      </div>
      {hitMilestone && (
        <ShareButtons
          card={{ kind: "milestone", streakDays: days, multiplier: multiplierLabel(multiplierX10) }}
          text={`🔥 ${days}-day saving streak on Ajora — ${multiplierLabel(multiplierX10)} ticket boost earned. No-loss savings, daily draws.`}
          refCode={myCode || undefined}
        />
      )}
    </motion.div>
  );
}
