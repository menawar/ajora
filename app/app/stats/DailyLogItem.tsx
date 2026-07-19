import { DailyRow } from "./types"; // will create this

export function DailyLogItem({ d }: { d: DailyRow }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm shadow-sm flex items-center justify-between">
      <div>
        <div className="font-bold text-gray-900">{d.date}</div>
        <div className="text-xs text-gray-500 mt-1">{d.txCount} txs · {d.activeUsers} active</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-celo-green">+{d.newUsers} new</div>
        <div className="text-xs text-gray-400 mt-1">{d.contributions} saves</div>
      </div>
    </div>
  );
}
