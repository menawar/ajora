"use client";

import { ShareButtons } from "./ShareButtons";
import { useCrew } from "../hooks/useCrew";
import { useStreak } from "../hooks/useStreak";
import { useWallet } from "../hooks/useWallet";
import { Flame, Award } from "lucide-react";
import { motion } from "framer-motion";

const MILESTONES = [7, 30, 90];

function multiplierLabel(x10: bigint): string {
  return `${(Number(x10) / 10).toFixed(1).replace(/\.0$/, "")}x`;
}

/** Streak flame + multiplier, with the one-tap daily check-in. */
export function StreakChip() {
  const { address } = useWallet();
  const { streakDays, multiplierX10, checkedInToday, checkIn, checkingIn, loading, badges } = useStreak();
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

      {badges && badges.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          {badges.map((b) => (
            <div
              key={b}
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800 shadow-sm ring-1 ring-orange-200"
              title={`${b}-Day Milestone Badge`}
            >
              <Award className="h-3 w-3 text-orange-600" />
              <span>{b}d</span>
            </div>
          ))}
        </div>
      )}

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
