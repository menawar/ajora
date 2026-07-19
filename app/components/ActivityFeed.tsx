const mockActivity = [
  { id: 1, text: "You saved 1.5 cUSD", time: "2h ago", type: "save" },
  { id: 2, text: "You earned the First Save badge!", time: "5h ago", type: "badge" },
  { id: 3, text: "You won 0.5 cUSD in the daily draw", time: "1d ago", type: "win" }
];

export function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-3">Recent Activity</h2>
      <div className="flex flex-col gap-3">
        {mockActivity.map(act => (
          <div key={act.id} className="text-sm">
            <p className="text-gray-800">{act.text}</p>
            <span className="text-xs text-gray-500">{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
