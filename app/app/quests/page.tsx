"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Target, Flame, WifiOff } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { QuestCard } from "../../components/ui/QuestCard";
import { useWallet } from "../../hooks/useWallet";
import { useSavings } from "../../hooks/useSavings";
import { useStreak } from "../../hooks/useStreak";
import { useCrew } from "../../hooks/useCrew";
import { useDraw } from "../../hooks/useDraw";
import { type Quest } from "../../data/quests";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

/**
 * Derive quests from real on-chain hook state when the API is unavailable.
 * Progress values come from the same hooks used throughout the app.
 */
function useOnChainQuests(address: string | undefined): Quest[] {
  const { entries } = useSavings();
  const { streakDays, checkedInToday } = useStreak();
  const { myPick } = useDraw();
  const { memberCount } = useCrew();

  return useMemo<Quest[]>(() => {
    const saveCount = entries.length;
    const streak = Number(streakDays);
    const hasPick = myPick.number !== 0;
    const crews = Number(memberCount);

    return [
      {
        id: "daily_save",
        title: "Daily Saver",
        description: "Save at least 1 cUSD into the vault today.",
        reward: 50,
        type: "daily",
        progress: { current: entries.filter((e) => e.isToday).length > 0 ? 1 : 0, target: 1 },
        claimed: false,
      },
      {
        id: "daily_checkin",
        title: "Daily Check-In",
        description: "Check in to maintain your savings streak.",
        reward: 25,
        type: "daily",
        progress: { current: checkedInToday ? 1 : 0, target: 1 },
        claimed: checkedInToday,
      },
      {
        id: "daily_pick",
        title: "Pick Your Number",
        description: "Pick a lucky number for today's draw.",
        reward: 25,
        type: "daily",
        progress: { current: hasPick ? 1 : 0, target: 1 },
        claimed: hasPick,
      },
      {
        id: "weekly_streak_3",
        title: "Consistent Builder",
        description: "Maintain a 3-day savings streak.",
        reward: 500,
        type: "weekly",
        progress: { current: Math.min(streak, 3), target: 3 },
        claimed: streak >= 3,
      },
      {
        id: "weekly_streak_7",
        title: "Week Warrior",
        description: "Maintain a 7-day streak.",
        reward: 1000,
        type: "weekly",
        progress: { current: Math.min(streak, 7), target: 7 },
        claimed: streak >= 7,
      },
      {
        id: "weekly_saves_5",
        title: "Five-Time Saver",
        description: "Save across 5 different days.",
        reward: 250,
        type: "weekly",
        progress: { current: Math.min(saveCount, 5), target: 5 },
        claimed: saveCount >= 5,
      },
      {
        id: "onetime_crew",
        title: "Crew Expansion",
        description: "Join or create a crew with at least 1 other member.",
        reward: 250,
        type: "one-time",
        progress: { current: Math.min(crews, 1), target: 1 },
        claimed: crews >= 1,
      },
    ];
  }, [entries, streakDays, checkedInToday, myPick, memberCount]);
}

export default function QuestsPage() {
  const { address } = useWallet();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiSource, setApiSource] = useState<"api" | "chain" | null>(null);

  // On-chain fallback quests (always computed; used when API fails)
  const chainQuests = useOnChainQuests(address);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (!address) {
      setLoading(false);
      return;
    }

    const fetchQuests = async () => {
      try {
        const res = await fetch(`/api/quests?address=${address}`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = await res.json();
        if (active && Array.isArray(json) && json.length > 0) {
          setQuests(json);
          setApiSource("api");
        } else {
          throw new Error("empty");
        }
      } catch {
        // Fall back to on-chain derived quests
        if (active) {
          setApiSource("chain");
          // chainQuests is already computed above; set it after state is ready
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchQuests();
    return () => { active = false; };
  }, [address]);

  // Sync chain-derived quests when API is unavailable
  useEffect(() => {
    if (apiSource === "chain") {
      setQuests(chainQuests);
    }
  }, [apiSource, chainQuests]);

  const dailyQuests   = quests.filter((q) => q.type === "daily");
  const weeklyQuests  = quests.filter((q) => q.type === "weekly");
  const onetimeQuests = quests.filter((q) => q.type === "one-time");

  // XP earned = sum of rewards for completed/claimed quests
  const xpEarned = quests
    .filter((q) => q.claimed || q.progress.current >= q.progress.target)
    .reduce((sum, q) => sum + q.reward, 0);

  return (
    <motion.main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="pt-4 flex items-start justify-between">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gradient flex items-center gap-3">
            Quests <Target className="w-6 h-6 text-blue-500" />
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Complete missions to earn XP and rewards.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 pt-10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-celo-gold bg-celo-gold/10 px-3 py-1.5 rounded-xl border border-celo-gold/20">
            <Flame className="w-4 h-4" />
            {xpEarned} XP
          </div>
          {apiSource === "chain" && (
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <WifiOff className="w-3 h-3" />
              on-chain
            </div>
          )}
        </div>
      </motion.header>

      {!address && !loading && (
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 text-center">
          <Target className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted font-medium">Connect your wallet to see quests.</p>
        </motion.div>
      )}

      {dailyQuests.length > 0 && (
        <motion.section variants={itemVariants} className="flex flex-col gap-4 mt-2">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full block" />
            Daily Missions
          </h2>
          {loading ? (
            <div className="text-sm text-text-muted">Loading…</div>
          ) : (
            dailyQuests.map((quest) => <QuestCard key={quest.id} quest={quest} />)
          )}
        </motion.section>
      )}

      {weeklyQuests.length > 0 && (
        <motion.section variants={itemVariants} className="flex flex-col gap-4 mt-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-celo-gold rounded-full block" />
            Weekly Challenges
          </h2>
          {loading ? (
            <div className="text-sm text-text-muted">Loading…</div>
          ) : (
            weeklyQuests.map((quest) => <QuestCard key={quest.id} quest={quest} />)
          )}
        </motion.section>
      )}

      {onetimeQuests.length > 0 && (
        <motion.section variants={itemVariants} className="flex flex-col gap-4 mt-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-celo-green rounded-full block" />
            One-Time Goals
          </h2>
          {loading ? (
            <div className="text-sm text-text-muted">Loading…</div>
          ) : (
            onetimeQuests.map((quest) => <QuestCard key={quest.id} quest={quest} />)
          )}
        </motion.section>
      )}

      {!loading && address && quests.length === 0 && (
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 text-center">
          <Target className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted font-medium">No quests found.</p>
        </motion.div>
      )}
    </motion.main>
  );
}
