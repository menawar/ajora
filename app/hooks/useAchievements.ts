"use client";

import { useMemo } from "react";
import { useSavings } from "./useSavings";
import { useStreak } from "./useStreak";
import { useDraw } from "./useDraw";
import { useCrew } from "./useCrew";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string; // human-readable
  category: "savings" | "streak" | "social" | "draw";
}

export function useAchievements(): { achievements: Achievement[]; unlockedCount: number } {
  const { entries, total, loading: savingsLoading } = useSavings();
  const { streakDays, badges, loading: streakLoading } = useStreak();
  const { myPick, loading: drawLoading } = useDraw();
  const { members } = useCrew();

  const achievements = useMemo<Achievement[]>(() => {
    const totalSaves = entries.length;
    const totalSaved = total;
    const streak = Number(streakDays);
    const hasReferrals = members && members.length > 0;
    const hasPick = myPick.number !== 0;

    return [
      // Savings achievements
      {
        id: "first_save",
        title: "First Save",
        description: "Make your first savings deposit",
        icon: "💰",
        unlocked: totalSaves >= 1,
        category: "savings",
      },
      {
        id: "five_saves",
        title: "Consistent Saver",
        description: "Save 5 times across any periods",
        icon: "📈",
        unlocked: totalSaves >= 5,
        category: "savings",
      },
      {
        id: "ten_saves",
        title: "10 Saves Club",
        description: "Save 10 times — you're building a habit",
        icon: "🏆",
        unlocked: totalSaves >= 10,
        category: "savings",
      },
      {
        id: "one_cusd",
        title: "One cUSD Saved",
        description: "Accumulate 1 cUSD in savings",
        icon: "🪙",
        unlocked: totalSaved >= 1_000_000_000_000_000_000n,
        category: "savings",
      },
      {
        id: "ten_cusd",
        title: "Ten cUSD Saved",
        description: "Save 10 cUSD or more",
        icon: "💎",
        unlocked: totalSaved >= 10_000_000_000_000_000_000n,
        category: "savings",
      },
      // Streak achievements
      {
        id: "first_checkin",
        title: "First Check-In",
        description: "Check in for your first daily streak",
        icon: "✅",
        unlocked: streak >= 1,
        category: "streak",
      },
      {
        id: "week_streak",
        title: "Week Warrior",
        description: "Maintain a 7-day check-in streak",
        icon: "🔥",
        unlocked: badges.includes(7) || streak >= 7,
        category: "streak",
      },
      {
        id: "month_streak",
        title: "Monthly Devotee",
        description: "Hit a 30-day streak — that's dedication",
        icon: "🌟",
        unlocked: badges.includes(30) || streak >= 30,
        category: "streak",
      },
      {
        id: "quarter_streak",
        title: "Quarter Champion",
        description: "90 consecutive days — legendary",
        icon: "👑",
        unlocked: badges.includes(90) || streak >= 90,
        category: "streak",
      },
      // Draw/pick achievements
      {
        id: "first_pick",
        title: "Lucky Number",
        description: "Pick a number for the first time",
        icon: "🎯",
        unlocked: hasPick,
        category: "draw",
      },
      // Social achievements
      {
        id: "first_referral",
        title: "Crew Starter",
        description: "Refer your first friend to Ajora",
        icon: "👥",
        unlocked: hasReferrals,
        category: "social",
      },
      {
        id: "five_referrals",
        title: "Community Builder",
        description: "Build a crew of 5 members",
        icon: "🌍",
        unlocked: (members?.length ?? 0) >= 5,
        category: "social",
      },
    ];
  }, [entries, total, streakDays, badges, myPick, members]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return { achievements, unlockedCount };
}
