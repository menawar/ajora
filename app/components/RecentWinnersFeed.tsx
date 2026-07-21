"use client";

import { motion } from "framer-motion";
import { Trophy, Loader2 } from "lucide-react";
import { formatUnits } from "viem";
import { useDraw } from "../hooks/useDraw";

type Address = `0x${string}`;

function shortAddr(addr: Address): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function cusd(value: bigint): string {
  const n = Number(formatUnits(value, 18));
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

export function RecentWinnersFeed() {
  const { last, loading } = useDraw();

  const winners = last?.winners ?? [];
  const hasData = !loading && winners.length > 0;

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
            <Trophy className="w-4 h-4 text-celo-gold" />
            Recent Winners
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-celo-green bg-celo-green/10 px-2 py-0.5 rounded-md">Live</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-6 text-text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading winners…
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="glass-panel rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
            <Trophy className="w-4 h-4 text-celo-gold" />
            Recent Winners
          </h3>
          {last?.resolved && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-celo-green bg-celo-green/10 px-2 py-0.5 rounded-md">
              #{last.periodId.toString()}
            </span>
          )}
        </div>
        <div className="py-6 px-4 text-center">
          <Trophy className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted font-medium">
            {last?.resolved
              ? "No winners found for last draw."
              : "First draw not yet resolved."}
          </p>
        </div>
      </div>
    );
  }

  // Double the list for seamless scroll loop
  const doubled = [...winners, ...winners];

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
          <Trophy className="w-4 h-4 text-celo-gold" />
          Last Draw Winners
          {last && (
            <span className="text-[10px] font-normal text-text-muted">
              #{last.periodId.toString()} · #{last.winningNumber}
            </span>
          )}
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-celo-green bg-celo-green/10 px-2 py-0.5 rounded-md">Live</span>
      </div>

      {/* Marquee Container */}
      <div className="relative flex overflow-x-hidden w-full bg-bg-secondary/30 py-4 mask-edges">
        <motion.div
          className="flex whitespace-nowrap gap-4 px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: Math.max(12, winners.length * 4), repeat: Infinity }}
        >
          {doubled.map((w, i) => {
            const initials = (w.address as string).slice(2, 4).toUpperCase();
            const shareStr = cusd(w.share);
            return (
              <div
                key={`${w.address}-${i}`}
                className="flex items-center gap-3 bg-bg-primary rounded-xl px-4 py-2 shadow-sm border border-gray-100 dark:border-gray-800 shrink-0"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-celo-gold to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                  {initials}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-medium text-text-secondary">
                    {shortAddr(w.address as Address)}
                  </span>
                  <span className="text-sm font-black text-text-primary">
                    +{shareStr} <span className="text-[10px] text-text-muted font-bold">cUSD</span>
                  </span>
                </div>
                {w.claimed && (
                  <span className="text-[10px] text-celo-green font-bold ml-1">✓</span>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
