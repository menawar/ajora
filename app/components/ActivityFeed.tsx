import { Coins, Trophy, Award } from "lucide-react";

const mockActivity = [
  { id: 1, text: "You saved 1.5 cUSD", time: "2h ago", icon: Coins, color: "text-celo-green" },
  { id: 2, text: "Earned First Save badge!", time: "5h ago", icon: Award, color: "text-blue-500" },
  { id: 3, text: "Won 0.5 cUSD", time: "1d ago", icon: Trophy, color: "text-amber-500" }
];

export function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-4">Recent Activity</h2>
      <div className="flex flex-col gap-4">
        {mockActivity.map(act => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-gray-50 ${act.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{act.text}</p>
                <p className="text-xs text-gray-500 mt-0.5">{act.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
