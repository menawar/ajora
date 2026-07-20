import { DailyMetric } from "../../hooks/useMetrics";

function cusd(wei: string): string {
  if (!wei) return "0";
  return (Number(BigInt(wei) / 10n ** 14n) / 10_000).toLocaleString("en", {
    maximumFractionDigits: 0,
  });
}

export function DailyLogItem({ d }: { d: DailyMetric }) {
  return (
    <div className="glass-panel rounded-2xl p-4 text-sm flex items-center justify-between">
      <div>
        <div className="font-bold text-text-primary">{d.date}</div>
        <div className="text-xs text-text-secondary mt-1">{d.txCount} txs · {d.dau} active</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-celo-green">+{d.newUsers} new</div>
        <div className="text-xs text-text-muted mt-1">${cusd(d.principalIn)} saved</div>
      </div>
    </div>
  );
}
