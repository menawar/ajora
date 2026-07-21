"use client";

import { useState, useMemo } from "react";
import { formatUnits } from "viem";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, Loader2, ArrowDownToLine, Trophy, Clock } from "lucide-react";
import Link from "next/link";
import { ConnectBar } from "../../components/ConnectBar";
import { Skeleton } from "../../components/ui/Skeleton";
import { SavingsChart } from "../../components/SavingsChart";
import { useSavings } from "../../hooks/useSavings";
import { useWallet } from "../../hooks/useWallet";

type FilterTab = "all" | "available" | "today";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function cusd(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

function fullDayLabel(periodId: bigint, isToday: boolean): string {
  if (isToday) return "Today";
  const date = new Date(Number(periodId) * 86_400_000);
  return date.toLocaleDateString("en", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const { address } = useWallet();
  const { entries, total, totalAllTime, loading, claimPrincipal, claiming, error } = useSavings();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    switch (filter) {
      case "available": return entries.filter((e) => !e.isToday);
      case "today":     return entries.filter((e) => e.isToday);
      default:          return entries;
    }
  }, [entries, filter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all",       label: "All",       count: entries.length },
    { id: "available", label: "Withdraw",  count: entries.filter((e) => !e.isToday).length },
    { id: "today",     label: "In Draw",   count: entries.filter((e) => e.isToday).length },
  ];

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
          href="/wallet"
          className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wallet
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-gradient">Savings History</h1>
        <p className="mt-1 text-sm text-text-secondary">Your full savings record across all periods</p>
      </motion.header>

      <motion.div variants={itemVariants}>
        <ConnectBar />
      </motion.div>

      {/* Summary stats */}
      {!loading && entries.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
          {[
            { label: "Recent (14d)", value: cusd(total) + " cUSD" },
            { label: "All Time (30d)", value: cusd(totalAllTime) + " cUSD" },
            { label: "Avg / Day", value: entries.length > 0 ? cusd(total / BigInt(entries.length)) + " cUSD" : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="glass-panel rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{label}</div>
              <div className="text-sm font-black text-celo-green">{value}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Chart */}
      {!loading && entries.length > 1 && (
        <motion.div variants={itemVariants}>
          <SavingsChart entries={entries} />
        </motion.div>
      )}

      {/* Filter tabs */}
      <motion.div variants={itemVariants} className="flex gap-2 p-1 glass-panel rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setFilter(tab.id); setPage(0); }}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
              filter === tab.id
                ? "bg-celo-green text-white shadow-[0_2px_8px_rgba(53,208,127,0.3)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${filter === tab.id ? "opacity-80" : "opacity-50"}`}>
              ({tab.count})
            </span>
          </button>
        ))}
      </motion.div>

      {/* Entries */}
      <motion.section variants={itemVariants} className="flex flex-col gap-3">
        {loading && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" className="h-16 w-full rounded-2xl" />
            ))}
          </>
        )}

        {!loading && address && filtered.length === 0 && (
          <div className="glass-panel rounded-3xl py-10 text-center border-dashed border-2 border-gray-200 dark:border-gray-800">
            <div className="text-3xl mb-2">📂</div>
            <p className="text-sm font-bold text-text-primary">No entries in this filter</p>
            <p className="text-xs text-text-secondary mt-1">Try a different tab</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {paginated.map((e, i) => (
            <motion.div
              layout
              key={e.periodId.toString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 }}
              className="flex items-center justify-between glass-panel rounded-2xl px-4 py-4 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${e.isToday ? "bg-amber-100" : "bg-celo-green/10"}`}>
                  {e.isToday ? (
                    <Clock className="w-4 h-4 text-amber-600" />
                  ) : (
                    <ArrowDownToLine className="w-4 h-4 text-celo-green" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-text-primary">{fullDayLabel(e.periodId, e.isToday)}</div>
                  <div className="text-xs font-semibold text-celo-green mt-0.5">{cusd(e.principal)} cUSD</div>
                </div>
              </div>
              {e.isToday ? (
                <span className="rounded-xl bg-celo-gold/15 px-3 py-1.5 text-xs font-bold text-amber-700 border border-celo-gold/20">
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
                    <>Withdraw</>
                  )}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {error && (
          <p className="text-center text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-30 hover:border-celo-green hover:text-celo-green transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm font-bold text-text-muted">{page + 1} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-30 hover:border-celo-green hover:text-celo-green transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </motion.section>

      <motion.footer variants={itemVariants} className="mt-auto pt-6 text-center text-xs font-medium text-text-muted pb-safe">
        Showing the last 30 periods. All savings are withdrawable — no lock-in.
      </motion.footer>
    </motion.main>
  );
}
