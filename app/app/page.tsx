"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { motion, type Variants } from "framer-motion";
import { Bell } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { ConnectBar } from "../components/ConnectBar";
import { Onboarding } from "../components/Onboarding";
import { StreakChip } from "../components/StreakChip";
import { PushToggle } from "../components/PushToggle";
import { Countdown, localCloseTime } from "../components/Countdown";
import { useDraw } from "../hooks/useDraw";
import { usePotToday } from "../hooks/usePotVault";
import { useWallet } from "../hooks/useWallet";
import { ComboFlow } from "../components/ComboFlow";
import { ActivityFeed } from "../components/ActivityFeed";
import { Skeleton } from "../components/ui/Skeleton";
import { CountUp } from "../components/ui/CountUp";

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

function cusd(value: bigint): string {
  const n = Number(formatUnits(value, 18));
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

/**
 * Home: live view of today's pot straight from Celo mainnet, plus the
 * one-tap save. Full Save/Pick/Crew screens land with #9/#10/#11.
 */
export default function Home() {
  const { address } = useWallet();
  const pot = usePotToday();
  const { myPick } = useDraw();
  const { t } = useTranslation();

  // If already picked, reuse the same number; otherwise pick a random number 1-9.
  const comboNumber = useMemo(() => myPick.number !== 0 ? myPick.number : Math.floor(Math.random() * 9) + 1, [myPick.number]);

  return (
    <motion.main 
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="pt-4 relative">
        <h1 className="text-5xl font-black tracking-tight text-gradient text-center mb-2">Ajora</h1>
        <Link 
          href="/notifications"
          className="absolute right-0 top-6 p-2 rounded-full bg-bg-secondary text-text-secondary hover:text-celo-green hover:bg-celo-green/10 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" />
        </Link>
        <p className="mt-1 text-text-secondary text-sm font-medium flex items-center justify-center gap-3">
          <span>{t("home.tagline")}</span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link href="/faq" className="text-celo-green underline hover:text-[#2ebf73] transition-colors">
            {t("home.faqLink", { defaultValue: "FAQ" })}
          </Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link href="/stats" className="text-celo-green underline hover:text-[#2ebf73] transition-colors">
            Stats
          </Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link href="/quests" className="text-celo-green underline hover:text-[#2ebf73] transition-colors">
            Quests
          </Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link href="/board" className="text-celo-green underline hover:text-[#2ebf73] transition-colors">
            Rank
          </Link>
        </p>
      </motion.header>

      <motion.div variants={itemVariants}><Onboarding /></motion.div>
      <motion.div variants={itemVariants}><ConnectBar /></motion.div>
      <motion.div variants={itemVariants}><StreakChip /></motion.div>
      <motion.div variants={itemVariants}><PushToggle /></motion.div>

      <motion.section variants={itemVariants} className="glass-panel rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-bg-secondary to-bg-primary">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-celo-green/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-celo-gold/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="text-sm font-bold uppercase tracking-widest text-celo-green mb-1">Today&apos;s Pot</div>
          <div className="text-5xl font-black text-text-primary tracking-tight">
            {pot.loading ? <Skeleton className="h-12 w-3/4 mb-2" /> : (
              <>
                <CountUp
                  to={Number(formatUnits(pot.jaraPot, 18))}
                  decimals={2}
                  duration={1400}
                />
                {" "}
                <span className="text-2xl font-bold text-text-muted uppercase tracking-wide">cUSD</span>
              </>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-medium text-text-secondary bg-bg-secondary/50 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Closes in
              </span>
              <span className="font-mono">
                <Countdown closeAt={pot.closeAt} onExpire={pot.refetch} />
                {pot.closeAt > 0 && <span className="text-text-muted ml-1">({localCloseTime(pot.closeAt)})</span>}
              </span>
            </div>
            
            <Link href="/board" className="flex justify-between items-center text-sm font-medium text-celo-green bg-celo-green/5 px-3 py-2 rounded-xl border border-celo-green/10 hover:bg-celo-green/10 transition-colors">
              <span>Total Tickets</span>
              <span className="font-bold flex items-center gap-1">{pot.loading ? "…" : pot.totalTickets.toString()} &rarr;</span>
            </Link>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="flex flex-col gap-4">
        {address ? (
          <ComboFlow amountCusd="0.1" pickNumber={comboNumber} />
        ) : (
          <div className="glass-panel rounded-3xl p-8 text-center border-dashed border-2 border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-text-primary mb-2">Connect to Play</h3>
            <p className="text-sm text-text-secondary">Join thousands of others saving and winning daily.</p>
          </div>
        )}

        {address && !pot.loading && (
          <div className="glass-panel rounded-2xl p-4 text-center">
            <p 
              className="text-sm font-medium text-text-secondary"
              dangerouslySetInnerHTML={{ __html: t("home.status", { tickets: `<strong class="text-text-primary">${pot.myTickets.toString()}</strong>`, balance: `<strong class="text-text-primary text-celo-green">${cusd(pot.myPrincipal)}</strong>` }) }}
            />
          </div>
        )}

        {address && pot.myTickets > 0n && myPick.number === 0 && (
          <Link
            href="/pick"
            className="rounded-2xl border-2 border-celo-gold bg-celo-gold/10 px-4 py-4 text-center font-bold text-amber-700 shadow-[0_0_15px_rgba(251,204,92,0.2)] hover:bg-celo-gold/20 transition-all animate-pulse"
          >
            {t("home.pickPrompt")}
          </Link>
        )}

        <div className="mt-2">
          <ActivityFeed />
        </div>
      </motion.section>

      <motion.footer variants={itemVariants} className="mt-auto pt-6 text-center text-xs font-medium text-text-muted pb-safe">
        {t("home.footer")}
      </motion.footer>
    </motion.main>
  );
}
