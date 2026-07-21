"use client";

import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Loader2, CheckCircle2 } from "lucide-react";
import { useWinnings } from "../../hooks/useWinnings";

function cusd(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

function dayLabel(periodId: bigint): string {
  const date = new Date(Number(periodId) * 86_400_000);
  return date.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" });
}

export function WinningsSection() {
  const { entries, total, loading, claimWinnings, claiming, error } = useWinnings();

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-5 flex items-center justify-center gap-2 text-text-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking for unclaimed winnings…
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="glass-panel rounded-3xl p-5 border border-celo-green/20 bg-celo-green/5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-celo-green/10">
          <Trophy className="w-5 h-5 text-celo-green" />
        </div>
        <div>
          <h2 className="font-bold text-text-primary text-sm">Unclaimed Winnings</h2>
          <p className="text-xs text-text-muted">
            {cusd(total)} cUSD ready to claim
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              layout
              key={entry.periodId.toString()}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center justify-between bg-bg-primary rounded-2xl px-4 py-3 border border-celo-green/10"
            >
              <div>
                <div className="text-sm font-bold text-text-primary">
                  🏆 Won on {dayLabel(entry.periodId)}
                </div>
                <div className="text-xs font-semibold text-celo-green mt-0.5">
                  {cusd(entry.amount)} cUSD
                </div>
              </div>

              <button
                type="button"
                onClick={() => void claimWinnings(entry.periodId)}
                disabled={claiming !== undefined}
                className="flex items-center gap-1.5 rounded-xl bg-celo-green px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(53,208,127,0.3)] transition-all active:scale-95 hover:bg-[#2ebf73] disabled:opacity-50 disabled:pointer-events-none"
              >
                {claiming === entry.periodId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Claiming…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Claim
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mt-3 text-xs font-semibold text-red-500 bg-red-50 p-2 rounded-xl text-center">
          {error}
        </p>
      )}
    </motion.section>
  );
}
