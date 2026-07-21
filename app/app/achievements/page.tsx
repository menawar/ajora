"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Medal } from "lucide-react";
import Link from "next/link";
import { MOCK_ACHIEVEMENTS } from "../../data/achievements";
import { BadgeCard } from "../../components/ui/BadgeCard";
import { useToast } from "../../hooks/useToast";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function AchievementsPage() {
  const { toast } = useToast();
  
  const handleBadgeClick = (title: string, unlocked: boolean) => {
    if (unlocked) {
      toast(`You unlocked: ${title}`, "success");
    } else {
      toast(`Keep saving to unlock ${title}`, "info");
    }
  };

  const unlockedCount = MOCK_ACHIEVEMENTS.filter(a => a.unlockedAt !== null).length;

  return (
    <motion.main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="pt-4">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-gradient flex items-center gap-3">
          Trophy Room <Medal className="w-6 h-6 text-celo-gold" />
        </h1>
        <p className="mt-1 text-sm text-text-secondary font-medium">
          {unlockedCount} of {MOCK_ACHIEVEMENTS.length} achievements unlocked
        </p>
      </motion.header>

      {/* Progress Bar overall */}
      <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-4">
        <div className="flex justify-between text-xs font-bold text-text-primary uppercase tracking-widest mb-2">
          <span>Completion</span>
          <span>{Math.round((unlockedCount / MOCK_ACHIEVEMENTS.length) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / MOCK_ACHIEVEMENTS.length) * 100}%` }}
            transition={{ duration: 1.5, type: "spring" }}
            className="h-full bg-celo-green rounded-full"
          />
        </div>
      </motion.div>

      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4">
        {MOCK_ACHIEVEMENTS.map((achievement, i) => (
          <BadgeCard
            key={achievement.id}
            achievement={achievement}
            index={i}
            onClick={() => handleBadgeClick(achievement.title, achievement.unlockedAt !== null)}
          />
        ))}
      </motion.section>
    </motion.main>
  );
}
