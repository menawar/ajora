"use client";

import { ShareButtons } from "./ShareButtons";
import { useStreak } from "../hooks/useStreak";
import { useWallet } from "../hooks/useWallet";

const MILESTONES = [7, 30, 90];

function multiplierLabel(x10: bigint): string {
  return `${(Number(x10) / 10).toFixed(1).replace(/\.0$/, "")}x`;
}

/** Streak flame + multiplier, with the one-tap daily check-in. */
export function StreakChip() {
  const { address } = useWallet();
  const { streakDays, multiplierX10, checkedInToday, checkIn, checkingIn, loading } = useStreak();

  if (!address || loading) return null;

  const days = Number(streakDays);
  const hitMilestone = MILESTONES.includes(days);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className="text-gray-600">
          🔥 <strong>{streakDays.toString()}</strong>-day streak ·{" "}
          <strong>{multiplierLabel(multiplierX10)}</strong> tickets
        </span>
        {!checkedInToday && (
          <button
            type="button"
            onClick={() => void checkIn()}
            disabled={checkingIn}
            className="rounded-full bg-celo-gold/20 px-3 py-1 font-medium text-amber-700 disabled:opacity-50"
          >
            {checkingIn ? "Checking in…" : "Check in ✓"}
          </button>
        )}
      </div>
      {hitMilestone && (
        <ShareButtons
          card={{ kind: "milestone", streakDays: days, multiplier: multiplierLabel(multiplierX10) }}
          text={`🔥 ${days}-day saving streak on Ajora — ${multiplierLabel(multiplierX10)} ticket boost earned. No-loss savings, daily draws.`}
        />
      )}
    </div>
  );
}
