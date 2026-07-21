"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, Search, RefreshCw, ArrowUp, ArrowDown, Medal } from "lucide-react";
import { useTopSavers } from "../../hooks/useTopSavers";
import { useWallet } from "../../hooks/useWallet";
import { useLeaderboardFilter, SortField, SortOrder } from "../../hooks/useLeaderboardFilter";
import { Skeleton } from "../../components/ui/Skeleton";
import { Input } from "../../components/ui/Input";

function cusd(v: bigint): string {
  return Number(formatUnits(v, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function BoardPage() {
  const { address } = useWallet();
  const [showSybilAdjusted, setShowSybilAdjusted] = useState(true);
  
  // includeFlagged = true when we are NOT doing sybil adjustment (i.e. we want to see the raw data)
  const { rows, loading, error, refetch, excludedFlagged } = useTopSavers(100, !showSybilAdjusted);
  
  const {
    query,
    setQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    paginated,
    totalPages,
    filtered
  } = useLeaderboardFilter(rows, 10);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to desc for new sorts
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-colors ${
        sortBy === field ? "bg-celo-green text-white" : "text-text-muted hover:bg-bg-secondary hover:text-text-primary"
      }`}
    >
      {label}
      {sortBy === field && (
        sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-6 bg-bg-primary pb-24">
      <header className="text-center pt-2">
        <h1 className="text-3xl font-black tracking-tight text-text-primary text-gradient">Top Savers</h1>
        <p className="mt-1 text-sm text-text-secondary">Climb the ranks by saving daily.</p>
        
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => setShowSybilAdjusted(!showSybilAdjusted)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${showSybilAdjusted ? "bg-celo-green/10 text-celo-green border border-celo-green/20" : "bg-bg-secondary text-text-muted border border-gray-200"}`}
          >
            {showSybilAdjusted ? (
              <><Shield className="w-4 h-4" /> Protected Mode</>
            ) : (
              <><ShieldAlert className="w-4 h-4" /> Raw Data Mode</>
            )}
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col gap-3 mt-2 sticky top-4 z-20 glass-panel p-3 rounded-2xl shadow-sm">
        <Input
          placeholder="Search by address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          prefixNode={<Search className="w-4 h-4" />}
          onClear={() => setQuery("")}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        />
        
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-medium text-text-muted">Sort by:</span>
          <div className="flex gap-1">
            <SortButton field="savings" label="Savings" />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col gap-3">
            {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
          </div>
        )}
        
        {!loading && filtered.length === 0 && !error && (
          <div className="glass-panel rounded-3xl py-12 text-center text-sm text-text-muted flex flex-col items-center gap-2">
            <Medal className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
            <span className="font-bold text-text-primary">No savers found</span>
            {query && <span>Adjust your search filters.</span>}
          </div>
        )}

        {error && (
          <div className="text-center text-sm p-4 glass-panel rounded-2xl border-red-100 flex flex-col items-center gap-2">
            <p className="text-red-500 font-bold">{error}</p>
            <button type="button" onClick={refetch} className="flex items-center gap-2 text-celo-green font-semibold bg-celo-green/10 px-4 py-2 rounded-xl">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}
        
        <AnimatePresence mode="popLayout">
          {paginated.map((r, i) => {
            const me = address && r.address.toLowerCase() === address.toLowerCase();
            const globalIndex = page * 10 + i;
            
            return (
              <motion.div
                layout
                key={r.address}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 30 }}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-colors ${
                  me ? "border-celo-green bg-celo-green/10 border-2" : "glass-panel"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center">
                    {sortBy === "savings" && sortOrder === "desc" && MEDALS[globalIndex] 
                      ? <span className="text-2xl">{MEDALS[globalIndex]}</span> 
                      : <span className="text-sm font-black text-text-muted">#{globalIndex + 1}</span>}
                  </span>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-text-primary text-sm">
                        {`${r.address.slice(0, 6)}…${r.address.slice(-4)}`}
                      </span>
                      {me && <span className="text-[10px] font-black bg-celo-green text-white px-1.5 py-0.5 rounded-md uppercase tracking-wide">You</span>}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-black text-text-primary leading-tight">
                    {cusd(r.total)} <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold block -mt-1">cUSD</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4 pb-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="rounded-xl border-2 border-gray-200 dark:border-gray-800 px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-30 hover:border-celo-green hover:text-celo-green transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm font-bold text-text-muted">{page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="rounded-xl border-2 border-gray-200 dark:border-gray-800 px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-30 hover:border-celo-green hover:text-celo-green transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {!loading && (
        <button type="button" onClick={refetch} className="flex items-center justify-center gap-2 text-sm font-bold text-text-muted hover:text-text-primary transition-colors py-2 mt-2">
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      )}

      {showSybilAdjusted && excludedFlagged > 0 && (
        <footer className="mt-auto pt-4 text-center text-xs font-semibold text-amber-500 pb-safe">
          {excludedFlagged} flagged account{excludedFlagged === 1 ? "" : "s"} hidden by sybil protection.
        </footer>
      )}
    </main>
  );
}
