"use client";
import { Coins, Trophy, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mockActivity = [
  { id: 1, text: "You saved 1.5 cUSD", time: "2h ago", icon: Coins, color: "text-celo-green", bg: "bg-celo-green/10" },
  { id: 2, text: "Earned First Save badge!", time: "5h ago", icon: Award, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: 3, text: "Won 0.5 cUSD", time: "1d ago", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" }
];

export function ActivityFeed() {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-gray-100 dark:border-gray-800">
      <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-celo-green rounded-full block" />
        Recent Activity
      </h2>
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {mockActivity.map((act, i) => {
            const Icon = act.icon;
            return (
              <motion.div
                layout
                key={act.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: i * 0.1 }}
                className="flex items-center gap-4 bg-bg-secondary p-3 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                <div className={`p-3 rounded-xl ${act.bg} ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm flex-1">
                  <p className="font-bold text-text-primary">{act.text}</p>
                  <p className="text-xs font-medium text-text-muted mt-0.5">{act.time}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
