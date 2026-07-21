"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Target, Flame } from "lucide-react";
import Link from "next/link";
import { MOCK_QUESTS } from "../../data/quests";
import { QuestCard } from "../../components/ui/QuestCard";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function QuestsPage() {
  const dailyQuests = MOCK_QUESTS.filter(q => q.type === "daily");
  const weeklyQuests = MOCK_QUESTS.filter(q => q.type === "weekly");
  
  const xpEarned = 750;

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
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-celo-gold bg-celo-gold/10 px-3 py-1.5 rounded-xl border border-celo-gold/20">
            <Flame className="w-4 h-4" />
            {xpEarned} XP
          </div>
        </div>
      </motion.header>

      <motion.section variants={itemVariants} className="flex flex-col gap-4 mt-2">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded-full block" />
          Daily Missions
        </h2>
        {dailyQuests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </motion.section>

      <motion.section variants={itemVariants} className="flex flex-col gap-4 mt-4">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-celo-gold rounded-full block" />
          Weekly Challenges
        </h2>
        {weeklyQuests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </motion.section>
    </motion.main>
  );
}
