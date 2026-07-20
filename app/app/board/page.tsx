"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useTopSavers } from "../../hooks/useTopSavers";
import { useWallet } from "../../hooks/useWallet";
import { Skeleton } from "../../components/ui/Skeleton";
import { Shield, ShieldAlert } from "lucide-react";

function cusd(v: bigint): string {
  return Number(formatUnits(v, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function BoardPage() {
  const { address } = useWallet();
  const [showSybilAdjusted, setShowSybilAdjusted] = useState(true);
  
  // includeFlagged = true when we are NOT doing sybil adjustment (i.e. we want to see the raw data)
  const { rows, loading, error, refetch, excludedFlagged } = useTopSavers(10, !showSybilAdjusted);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 bg-bg-primary">
      <header className="text-center pt-4">
        <h1 className="text-3xl font-black tracking-tight text-text-primary text-gradient">Top Savers</h1>
        <p className="mt-2 text-sm text-text-secondary">Resets at midnight UTC with the draw.</p>
        
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => setShowSybilAdjusted(!showSybilAdjusted)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${showSybilAdjusted ? "bg-celo-green/10 text-celo-green border border-celo-green/20" : "bg-bg-secondary text-text-muted border border-gray-200"}`}
          >
            {showSybilAdjusted ? (
              <><Shield className="w-4 h-4" /> Sybil-adjusted (Protected)</>
            ) : (
              <><ShieldAlert className="w-4 h-4" /> Raw data (Unprotected)</>
            )}
          </button>
        </div>
        
        {showSybilAdjusted && excludedFlagged > 0 && (
          <p className="mt-2 text-xs text-text-muted">
            {excludedFlagged} flagged account{excludedFlagged === 1 ? "" : "s"} hidden
          </p>
        )}
      </header>

      <section className="flex flex-col gap-3 mt-2">
        {loading && (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        )}
        {!loading && rows.length === 0 && !error && (
          <div className="glass-panel rounded-2xl py-8 text-center text-sm text-text-muted">
            Nobody has saved yet today — be the first 🥇
          </div>
        )}
        {error && (
          <div className="text-center text-sm p-4 glass-panel rounded-2xl border-red-100">
            <p className="text-red-500">{error}</p>
            <button type="button" onClick={refetch} className="mt-2 text-celo-green font-semibold">
              Retry
            </button>
          </div>
        )}
        {rows.map((r, i) => {
          const me = address && r.address.toLowerCase() === address.toLowerCase();
          return (
            <div
              key={r.address}
              className={`flex items-center justify-between rounded-2xl px-4 py-4 transition-colors ${
                me ? "border-celo-green bg-celo-green/10 border-2" : "glass-panel"
              }`}
            >
              <span className="flex items-center gap-3 text-sm">
                <span className="w-8 text-xl text-center">{MEDALS[i] ?? <span className="text-text-muted font-bold">{i + 1}</span>}</span>
                <span className="font-mono font-medium text-text-primary bg-bg-secondary px-2 py-1 rounded-md">
                  {r.address.slice(0, 6)}…{r.address.slice(-4)}
                </span>
                {me && <span className="text-xs font-black text-celo-green uppercase tracking-wide">You</span>}
              </span>
              <strong className="text-lg font-black text-text-primary">{cusd(r.total)} <span className="text-xs text-text-muted font-normal uppercase tracking-wide">cUSD</span></strong>
            </div>
          );
        })}
      </section>

      {!loading && (
        <button type="button" onClick={refetch} className="text-center text-sm text-text-muted hover:text-text-primary transition-colors py-2">
          Refresh Leaderboard
        </button>
      )}

      <footer className="mt-auto text-center text-xs text-text-muted pb-safe">
        Crew leaderboards arrive with crews. More saved = more tickets tonight.
      </footer>
    </main>
  );
}
