"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Medal } from "lucide-react";
import Link from "next/link";
import { useAchievements } from "../../hooks/useAchievements";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "../../lib/i18n";
import { useWallet } from "../../hooks/useWallet";
import { Skeleton } from "../../components/ui/Skeleton";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// Map the useAchievements shape to a display tier (for BadgeCard compat)
const tierMap: Record<string, "bronze" | "silver" | "gold" | "diamond"> = {
  savings: "bronze",
  streak:  "silver",
  draw:    "gold",
  social:  "diamond",
};

export default function AchievementsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { address } = useWallet();
  const { achievements, unlockedCount } = useAchievements();

  // Determine loading: achievements hook relies on savings/streak/draw hooks
  // which themselves set loading states; we use unlockedCount === 0 && !address
  // as a simple proxy — the hook itself handles it gracefully.
  const isLoading = !address;

  const handleBadgeClick = (title: string, unlocked: boolean) => {
    if (unlocked) {
      toast(`You unlocked: ${title}`, "success");
    } else {
      toast(`Keep saving to unlock ${title}`, "info");
    }
  };

  const total = achievements.length;

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
          {t("achievements.title")} <Medal className="w-6 h-6 text-celo-gold" />
        </h1>
        <p className="mt-1 text-sm text-text-secondary font-medium">
          {address
            ? t("achievements.unlocked")
                .replace("{{count}}", String(unlockedCount))
                .replace("{{total}}", String(total))
            : "Connect your wallet to track achievements."}
        </p>
      </motion.header>

      {/* Progress bar */}
      <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-4">
        <div className="flex justify-between text-xs font-bold text-text-primary uppercase tracking-widest mb-2">
          <span>Completion</span>
          <span>{total > 0 ? Math.round((unlockedCount / total) * 100) : 0}%</span>
        </div>
        <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: total > 0 ? `${(unlockedCount / total) * 100}%` : "0%" }}
            transition={{ duration: 1.5, type: "spring" }}
            className="h-full bg-celo-green rounded-full"
          />
        </div>
      </motion.div>

      {/* Achievement grid */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))
          : achievements.map((achievement) => (
              <motion.button
                key={achievement.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBadgeClick(achievement.title, achievement.unlocked)}
                className={`glass-panel rounded-2xl p-4 text-left flex flex-col gap-3 transition-all border-2 ${
                  achievement.unlocked
                    ? "border-celo-green/40 bg-celo-green/5"
                    : "border-transparent opacity-60"
                }`}
              >
                <div className="text-3xl">{achievement.icon}</div>
                <div>
                  <p className="text-sm font-black text-text-primary leading-tight">
                    {achievement.title}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                    {achievement.description}
                  </p>
                </div>
                {achievement.unlocked && (
                  <span className="text-[10px] font-bold text-celo-green uppercase tracking-wider">
                    ✓ Unlocked
                  </span>
                )}
              </motion.button>
            ))}
      </motion.section>
    </motion.main>
  );
}
