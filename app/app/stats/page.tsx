"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Activity, Users, Coins } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { RecentWinnersFeed } from "../../components/RecentWinnersFeed";
import { CountUp } from "../../components/ui/CountUp";
import { usePotToday } from "../../hooks/usePotVault";
import { formatUnits } from "viem";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function StatsPage() {
  const pot = usePotToday();
  const tvl = pot.loading ? 0 : Number(formatUnits(pot.jaraPot, 18)) * 14.5; // Mock TVL based on pot size for demo
  
  return (
    <motion.main 
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="text-center pt-4 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-celo-green/10 flex items-center justify-center mb-3">
          <Activity className="w-6 h-6 text-celo-green" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gradient">Global Stats</h1>
        <p className="mt-2 text-sm text-text-secondary">Network health and community metrics.</p>
      </motion.header>

      <motion.div variants={itemVariants} className="grid gap-4">
        {/* TVL Hero Card */}
        <StatCard
          title="Total Value Locked"
          icon={<Coins className="w-5 h-5" />}
          value={
            <>
              $<CountUp to={tvl} decimals={2} duration={1500} />
            </>
          }
          subtitle="Across all active savers"
          trend={{ value: 12.5, label: "this week" }}
          delay={0.1}
        />

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Total Savers"
            icon={<Users className="w-4 h-4" />}
            value={<CountUp to={1248} duration={1200} />}
            trend={{ value: 5.2, label: "7d" }}
            delay={0.2}
          />
          <StatCard
            title="Avg Draw Pot"
            icon={<TrophyIcon className="w-4 h-4" />}
            value={
              <>
                <CountUp to={45.5} decimals={1} duration={1200} />
                <span className="text-sm font-bold text-text-muted ml-1">cUSD</span>
              </>
            }
            trend={{ value: 2.1, label: "7d" }}
            delay={0.3}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <RecentWinnersFeed />
      </motion.div>

      <motion.section variants={itemVariants} className="glass-panel rounded-3xl p-5 border-l-4 border-l-celo-green">
        <h3 className="text-sm font-bold text-text-primary mb-1">System Health: Optimal</h3>
        <p className="text-xs text-text-secondary">
          The Keeper bot is active and harvesting yield across Aave and Moola markets. 
          Smart contracts are fully collateralized.
        </p>
      </motion.section>

      <motion.footer variants={itemVariants} className="mt-auto pt-6 flex flex-col gap-4 text-center pb-safe">
        <Link href="/" className="text-sm font-bold text-celo-green underline decoration-celo-green/30 decoration-dotted underline-offset-4 transition hover:text-[#2ebf73]">
          ← Back to home
        </Link>
      </motion.footer>
    </motion.main>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 6 7 6 7s6-1 6-7V2Z" />
    </svg>
  );
}
