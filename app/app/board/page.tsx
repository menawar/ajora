"use client";

import { formatUnits } from "viem";
import { useTopSavers } from "../../hooks/useTopSavers";
import { useWallet } from "../../hooks/useWallet";

function cusd(v: bigint): string {
  return Number(formatUnits(v, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function BoardPage() {
  const { address } = useWallet();
  const { rows, loading, error, refetch, excludedFlagged } = useTopSavers(10);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Today&apos;s top savers</h1>
        <p className="mt-1 text-sm text-gray-500">Resets at midnight UTC with the draw.</p>
        {excludedFlagged > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {excludedFlagged} flagged account{excludedFlagged === 1 ? "" : "s"} hidden
            (anti-sybil)
          </p>
        )}
      </header>

      <section className="flex flex-col gap-2">
        {loading && (
          <>
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          </>
        )}
        {!loading && rows.length === 0 && !error && (
          <p className="py-8 text-center text-sm text-gray-400">
            Nobody has saved yet today — be the first 🥇
          </p>
        )}
        {error && (
          <div className="text-center text-sm">
            <p className="text-red-500">{error}</p>
            <button type="button" onClick={refetch} className="mt-1 underline">
              Retry
            </button>
          </div>
        )}
        {rows.map((r, i) => {
          const me = address && r.address.toLowerCase() === address.toLowerCase();
          return (
            <div
              key={r.address}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                me ? "border-celo-green bg-celo-green/5" : "border-gray-100"
              }`}
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="w-7 text-lg">{MEDALS[i] ?? `${i + 1}.`}</span>
                <span className="font-mono">
                  {r.address.slice(0, 6)}…{r.address.slice(-4)}
                </span>
                {me && <span className="text-xs font-semibold text-celo-green">you</span>}
              </span>
              <strong>{cusd(r.total)} cUSD</strong>
            </div>
          );
        })}
      </section>

      {!loading && (
        <button type="button" onClick={refetch} className="text-center text-sm text-gray-400 underline">
          Refresh
        </button>
      )}

      <footer className="mt-auto text-center text-xs text-gray-400">
        Crew leaderboards arrive with crews. More saved = more tickets tonight.
      </footer>
    </main>
  );
}
