"use client";

import { motion, type Variants } from "framer-motion";
import { useAchievements } from "../../hooks/useAchievements";
import { AchievementCard } from "../../components/AchievementCard";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useWallet } from "../../hooks/useWallet";
import { ConnectBar } from "../../components/ConnectBar";
import Link from "next/link";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function AchievementsPage() {
  const { address } = useWallet();
  const { achievements, unlockedCount } = useAchievements();
  const pct = achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0;

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked   = achievements.filter((a) => !a.unlocked);

  return (
    <motion.main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="pt-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-gradient">Achievements</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      </motion.header>

      <motion.div variants={itemVariants}>
        <ConnectBar />
      </motion.div>

      {/* Progress */}
      {address && (
        <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-text-primary">Overall Progress</div>
            <div className="text-sm font-black text-celo-green">{unlockedCount}/{achievements.length}</div>
          </div>
          <ProgressBar value={pct} variant="gradient" size="lg" />
          <p className="text-xs text-text-muted mt-2">
            {locked.length} more to unlock — keep saving!
          </p>
        </motion.div>
      )}

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <motion.section variants={itemVariants}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-celo-green mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-celo-green rounded-full" />
            Unlocked ({unlocked.length})
          </h2>
          <div className="flex flex-col gap-3">
            {unlocked.map((a, i) => (
              <AchievementCard key={a.id} achievement={a} index={i} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <motion.section variants={itemVariants}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-gray-300 dark:bg-gray-600 rounded-full" />
            Locked ({locked.length})
          </h2>
          <div className="flex flex-col gap-3">
            {locked.map((a, i) => (
              <AchievementCard key={a.id} achievement={a} index={i} />
            ))}
          </div>
        </motion.section>
      )}

      {!address && (
        <motion.div variants={itemVariants} className="glass-panel rounded-3xl py-12 text-center border-dashed border-2 border-gray-200 dark:border-gray-800">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-sm font-bold text-text-primary">Connect to see your achievements</p>
        </motion.div>
      )}

      <motion.footer variants={itemVariants} className="mt-auto text-center text-xs text-text-muted pb-safe">
        Achievements are computed from your on-chain activity. No cheating!
      </motion.footer>
    </motion.main>
  );
}
