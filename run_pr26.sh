#!/bin/bash
# Commit 1: Create base component
cat << 'INNER_EOF' > app/components/ActivityFeed.tsx
export function ActivityFeed() {
  return <div className="activity-feed"></div>;
}
INNER_EOF
git add app/components/ActivityFeed.tsx
git commit -m "feat(activity): create base ActivityFeed component"

# Commit 2: Add styles
cat << 'INNER_EOF' > app/components/ActivityFeed.tsx
export function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-3">Recent Activity</h2>
      <div className="flex flex-col gap-3"></div>
    </div>
  );
}
INNER_EOF
git add app/components/ActivityFeed.tsx
git commit -m "style(activity): add structural styling to ActivityFeed"

# Commit 3: Add mocked data
cat << 'INNER_EOF' > app/components/ActivityFeed.tsx
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
INNER_EOF
git add app/components/ActivityFeed.tsx
git commit -m "feat(activity): add mocked data and mapping"

# Commit 4: Add lucide icons
cat << 'INNER_EOF' > app/components/ActivityFeed.tsx
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
INNER_EOF
git add app/components/ActivityFeed.tsx
git commit -m "feat(activity): integrate Lucide icons into feed"

# Commit 5: Add animations
cat << 'INNER_EOF' > app/components/ActivityFeed.tsx
"use client";
import { Coins, Trophy, Award } from "lucide-react";
import { motion } from "framer-motion";

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
        {mockActivity.map((act, i) => {
          const Icon = act.icon;
          return (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`p-2 rounded-full bg-gray-50 ${act.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{act.text}</p>
                <p className="text-xs text-gray-500 mt-0.5">{act.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
INNER_EOF
git add app/components/ActivityFeed.tsx
git commit -m "style(activity): add framer-motion stagger animations"

# Commit 6: Add to dashboard page
cat << 'INNER_EOF' > app/app/dashboard/page.tsx
import { LevelProgress } from "./LevelProgress";
import { ActivityFeed } from "../../components/ActivityFeed";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24">
      <header className="text-center">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Your savings journey</p>
      </header>

      <LevelProgress level={5} xp={450} nextLevelXp={1000} />
      <ActivityFeed />
    </main>
  );
}
INNER_EOF
git add app/app/dashboard/page.tsx
git commit -m "feat(dashboard): integrate ActivityFeed into dashboard page"
