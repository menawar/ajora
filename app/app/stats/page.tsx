import dailyJson from "../../../metrics/daily.json";
import summary from "../../../metrics/summary.json";

interface DailyRow {
  periodId: number;
  date: string;
  txCount: number;
  activeUsers: number;
  newUsers: number;
  contributions: number;
  principalIn: string;
  prizesPaid: string;
  sprays: number;
  welcomes: number;
  picks: number;
  checkIns: number;
  resolved: { winningNumber: number; pot: string } | null;
}

const daily = dailyJson as DailyRow[];

/**
 * Proof-of-Ship metrics, rendered from the nightly rollup committed by the
 * metrics workflow (Vercel rebuilds on that push). Static — zero client RPC.
 */

function cusd(wei: string): string {
  return (Number(BigInt(wei) / 10n ** 14n) / 10_000).toLocaleString("en", {
    maximumFractionDigits: 2,
  });
}

const cards = [
  { label: "Total transactions", value: String(summary.totalTx) },
  { label: "Unique users (raw)", value: String(summary.totalUsers ?? 0) },
  { label: "Verified humans", value: String(summary.verifiedUsers ?? 0) },
  { label: "Principal saved", value: `${cusd(summary.totalPrincipalIn)} cUSD` },
  { label: "Prizes paid", value: `${cusd(summary.totalPrizesPaid)} cUSD` },
];

export const metadata = { title: "Ajora — Stats" };

export default function StatsPage() {
  const rows = [...daily].reverse();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Ajora stats</h1>
        <p className="mt-1 text-sm text-gray-500">
          On-chain, updated nightly. Raw and verified-human counts shown separately.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-xl font-bold">{c.value}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500">Daily</h2>
        {rows.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">First rollup lands tonight.</p>
        )}
        {rows.map((d) => (
          <div key={d.periodId} className="rounded-xl border border-gray-100 px-4 py-3 text-sm">
            <div className="flex justify-between font-medium">
              <span>{d.date}</span>
              <span>
                {d.txCount} txs · {d.activeUsers} active
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
              <span>+{d.newUsers} new</span>
              <span>{d.contributions} saves</span>
              <span>{d.picks} picks</span>
              <span>{d.checkIns} check-ins</span>
              <span>{d.sprays} sprays</span>
              {d.resolved && <span>🎰 {d.resolved.winningNumber} won</span>}
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-auto text-center text-xs text-gray-400">
        Collector: app/scripts/collect-metrics.mjs · exact per-period event topics ·
        updated {summary.updatedAt?.slice(0, 10) ?? "—"}
      </footer>
    </main>
  );
}
