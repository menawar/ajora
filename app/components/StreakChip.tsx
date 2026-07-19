"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useCrew } from "../hooks/useCrew";
import { useStreak } from "../hooks/useStreak";
import { useWallet } from "../hooks/useWallet";
import { Flame, Award, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { triggerSmallConfetti } from "../lib/confetti";

import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ShareButtons } from "./ShareButtons";

const ShareButtons = dynamic(() => import("./ShareButtons").then((mod) => mod.ShareButtons));
const MILESTONES = [7, 30, 90];

function multiplierLabel(x10: bigint): string {
  return `${(Number(x10) / 10).toFixed(1).replace(/\.0$/, "")}x`;
}

/** Streak flame + multiplier, with the one-tap daily check-in. */
export function StreakChip() {
  const { address } = useWallet();
  const { streakDays, multiplierX10, checkedInToday, checkIn, checkingIn, loading, badges } = useStreak();
  const { myCode } = useCrew();
  const wasCheckedIn = useRef(checkedInToday);

  useEffect(() => {
    if (!wasCheckedIn.current && checkedInToday) {
      triggerSmallConfetti();
    }
    wasCheckedIn.current = checkedInToday;
  }, [checkedInToday]);

  if (!address || loading) return null;

  const days = Number(streakDays);
  const hitMilestone = MILESTONES.includes(days);

  return (
    <Card 
      variant="glass"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
        <span className="text-gray-800">
          <strong>{streakDays.toString()}</strong>-day streak ·{" "}
          <strong>{multiplierLabel(multiplierX10)}</strong> tickets
        </span>
        {!checkedInToday && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void checkIn()}
            disabled={checkingIn}
            className="ml-2 rounded-full border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          >
            {checkingIn ? "Checking in…" : "Check in ✓"}
          </Button>
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
    </Card>
  );
}
