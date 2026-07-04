"use client";

import { useStreak } from "../hooks/useStreak";
import { useWallet } from "../hooks/useWallet";

function multiplierLabel(x10: bigint): string {
  return `${(Number(x10) / 10).toFixed(1).replace(/\.0$/, "")}x`;
}

/** Streak flame + multiplier, with the one-tap daily check-in. */
export function StreakChip() {
  const { address } = useWallet();
  const { streakDays, multiplierX10, checkedInToday, checkIn, checkingIn, loading } = useStreak();

  if (!address || loading) return null;

  return (
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
  );
}
