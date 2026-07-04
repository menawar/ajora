"use client";

import { formatUnits } from "viem";
import { ConnectBar } from "../../components/ConnectBar";
import { useSavings } from "../../hooks/useSavings";
import { useWallet } from "../../hooks/useWallet";

function cusd(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

function dayLabel(periodId: bigint, isToday: boolean): string {
  if (isToday) return "Today";
  const date = new Date(Number(periodId) * 86_400_000);
  return date.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" });
}

export default function WalletPage() {
  const { address } = useWallet();
  const { entries, total, loading, claimPrincipal, claiming, error } = useSavings();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="mt-1 text-sm text-gray-500">
          <strong className="text-celo-green">No-loss:</strong> every cent you saved is yours,
          withdrawable any time.
        </p>
      </header>

      <ConnectBar />

      <section className="rounded-2xl border border-gray-100 p-5 text-center">
        <div className="text-sm text-gray-500">Saved this week</div>
        <div className="text-3xl font-bold">
          {loading ? "…" : `${cusd(total)} cUSD`}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        {loading && (
          <>
            <div className="h-14 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-14 animate-pulse rounded-xl bg-gray-100" />
          </>
        )}
        {!loading && address && entries.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            Nothing saved in the last 7 days yet — start on the Save tab.
          </p>
        )}
        {entries.map((e) => (
          <div
            key={e.periodId.toString()}
            className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
          >
            <div>
              <div className="font-medium">{dayLabel(e.periodId, e.isToday)}</div>
              <div className="text-sm text-gray-500">{cusd(e.principal)} cUSD</div>
            </div>
            {e.isToday ? (
              <span className="rounded-lg bg-celo-gold/15 px-3 py-1.5 text-sm font-medium text-amber-700">
                In tonight&apos;s draw 🎯
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void claimPrincipal(e.periodId)}
                disabled={claiming !== undefined}
                className="rounded-lg border border-celo-green px-3 py-1.5 text-sm font-medium text-celo-green disabled:opacity-50"
              >
                {claiming === e.periodId ? "Withdrawing…" : "Withdraw"}
              </button>
            )}
          </div>
        ))}
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
      </section>

      <footer className="mt-auto text-center text-xs text-gray-400">
        Today&apos;s savings ride in tonight&apos;s draw and unlock right after — every other
        day withdraws instantly. Winnings claims appear after each draw.
      </footer>
    </main>
  );
}
