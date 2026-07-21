"use client";

import { formatUnits } from "viem";
import { motion, type Variants } from "framer-motion";
import { Wallet, TrendingUp, Loader2, ArrowDownToLine, CalendarDays } from "lucide-react";
import { ConnectBar } from "../../components/ConnectBar";
import { Skeleton } from "../../components/ui/Skeleton";
import { SavingsChart } from "../../components/SavingsChart";
import { useSavings } from "../../hooks/useSavings";
import { useStreak } from "../../hooks/useStreak";
import { useWallet } from "../../hooks/useWallet";
import { useDraw } from "../../hooks/useDraw";
import { WinningsSection } from "./WinningsSection";
import Link from "next/link";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function cusd(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

function dayLabel(periodId: bigint, isToday: boolean): string {
  if (isToday) return "Today";
  const date = new Date(Number(periodId) * 86_400_000);
  return date.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" });
}

function multiplierLabel(x10: bigint): string {
  return `${(Number(x10) / 10).toFixed(1).replace(/\.0$/, "")}x`;
}

export default function WalletPage() {
  const { address } = useWallet();
  const { entries, total, totalAllTime, loading, claimPrincipal, claiming, error } = useSavings();
  const { streakDays, multiplierX10 } = useStreak();
  const { myPick } = useDraw();

  return (
    <motion.main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="text-center pt-4">
        <h1 className="text-3xl font-black tracking-tight text-gradient">Wallet</h1>
        <p className="mt-2 text-sm font-medium text-text-secondary">
          <span className="text-celo-green font-bold">No-loss:</span> every cent you saved is yours,
          withdrawable any time.
        </p>
      </motion.header>

      <motion.div variants={itemVariants}>
        <ConnectBar />
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        {/* Recent savings */}
        <div className="glass-panel rounded-3xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Last 14 days
          </div>
          {loading ? (
            <Skeleton variant="text" className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-black text-text-primary tracking-tight">
              {cusd(total)}
              <span className="text-sm font-bold text-text-muted ml-1">cUSD</span>
            </div>
          )}
        </div>

        {/* All-time savings */}
        <div className="glass-panel rounded-3xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            All Time
          </div>
          {loading ? (
            <Skeleton variant="text" className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-black text-text-primary tracking-tight">
              {cusd(totalAllTime)}
              <span className="text-sm font-bold text-text-muted ml-1">cUSD</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Streak + draw status ribbon */}
      {address && (
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl">🔥</span>
            <div>
              <span className="font-bold text-text-primary">{streakDays.toString()}-day</span>
              <span className="text-text-secondary"> streak · </span>
              <span className="font-bold text-celo-green">{multiplierLabel(multiplierX10)} tickets</span>
            </div>
          </div>
          {myPick.number !== 0 ? (
            <span className="rounded-xl bg-celo-green/10 text-celo-green px-3 py-1.5 text-xs font-bold border border-celo-green/20">
              In draw #{myPick.number} 🎯
            </span>
          ) : (
            <Link
              href="/pick"
              className="rounded-xl bg-amber-100 text-amber-700 px-3 py-1.5 text-xs font-bold border border-amber-200 hover:bg-amber-200 transition-colors"
            >
              Pick a number
            </Link>
          )}
        </motion.div>
      )}

      {/* Unclaimed winnings */}
      <motion.div variants={itemVariants}>
        <WinningsSection />
      </motion.div>

      {/* Savings chart */}
      {!loading && entries.length > 1 && (
        <motion.div variants={itemVariants}>
          <SavingsChart entries={entries} />
        </motion.div>
      )}

      {/* Savings entries */}
      <motion.section variants={itemVariants} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-text-muted" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Your Savings</h2>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-celo-green hover:underline transition-colors"
          >
            View full history →
          </Link>
        </div>

        {loading && (
          <>
            <div className="h-16 animate-pulse rounded-2xl bg-bg-secondary" />
            <div className="h-16 animate-pulse rounded-2xl bg-bg-secondary" />
            <div className="h-16 animate-pulse rounded-2xl bg-bg-secondary" />
          </>
        )}

        {!loading && address && entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel rounded-3xl py-12 text-center border-dashed border-2 border-gray-200 dark:border-gray-800"
          >
            <div className="text-4xl mb-3">💰</div>
            <p className="text-sm font-bold text-text-primary mb-1">No savings yet</p>
            <p className="text-xs text-text-secondary mb-4">Start saving today to enter the daily draw</p>
            <Link
              href="/save"
              className="inline-block rounded-2xl bg-celo-green px-6 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(53,208,127,0.3)] hover:bg-[#2ebf73] transition-all active:scale-95"
            >
              Start Saving
            </Link>
          </motion.div>
        )}

        {!loading && !address && (
          <div className="glass-panel rounded-3xl py-8 text-center text-sm text-text-secondary">
            Connect your wallet to see your savings
          </div>
        )}

        {entries.map((e, i) => (
          <motion.div
            key={e.periodId.toString()}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
            className="flex items-center justify-between glass-panel rounded-2xl px-4 py-4 border border-gray-100 dark:border-gray-800"
          >
            <div>
              <div className="font-bold text-text-primary">{dayLabel(e.periodId, e.isToday)}</div>
              <div className="text-sm font-semibold text-celo-green mt-0.5">{cusd(e.principal)} cUSD</div>
            </div>
            {e.isToday ? (
              <span className="rounded-xl bg-celo-gold/15 px-3 py-2 text-xs font-bold text-amber-700 border border-celo-gold/20">
                In draw 🎯
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void claimPrincipal(e.periodId)}
                disabled={claiming !== undefined}
                className="flex items-center gap-1.5 rounded-xl border-2 border-celo-green px-3 py-2 text-xs font-bold text-celo-green hover:bg-celo-green hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {claiming === e.periodId ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />Withdrawing…</>
                ) : (
                  <><ArrowDownToLine className="w-3 h-3" />Withdraw</>
                )}
              </button>
            )}
          </motion.div>
        ))}

        {error && (
          <p className="text-center text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
        )}
      </motion.section>

      <motion.footer variants={itemVariants} className="mt-auto pt-6 text-center text-xs font-medium text-text-muted pb-safe">
        Today&apos;s savings ride in tonight&apos;s draw and unlock right after.
        Winnings are always claimable — they never expire.
      </motion.footer>
    </motion.main>
  );
}
