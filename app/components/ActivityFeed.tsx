"use client";
import { Coins, Trophy, Award, Loader2, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useActivity } from "../hooks/useActivity";
import { useWallet } from "../hooks/useWallet";

const iconMap = {
  save:    { Icon: Coins,  color: "text-celo-green",  bg: "bg-celo-green/10" },
  checkin: { Icon: Award,  color: "text-blue-500",    bg: "bg-blue-500/10" },
  win:     { Icon: Trophy, color: "text-amber-500",   bg: "bg-amber-500/10" },
} as const;

export function ActivityFeed() {
  const { address } = useWallet();
  const { items, loading } = useActivity();

  return (
    <div className="glass-panel rounded-3xl p-5 border border-gray-100 dark:border-gray-800">
      <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-celo-green rounded-full block" />
        Recent Activity
      </h2>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading activity…
        </div>
      )}

      {!loading && !address && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Activity className="w-8 h-8 text-text-muted" />
          <p className="text-sm text-text-muted font-medium">Connect your wallet to see activity</p>
        </div>
      )}

      {!loading && address && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Activity className="w-8 h-8 text-text-muted" />
          <p className="text-sm text-text-muted font-medium">No recent activity yet.</p>
          <p className="text-xs text-text-muted">Save, check in or win to see your history here.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {items.map((act, i) => {
            const { Icon, color, bg } = iconMap[act.type];
            return (
              <motion.div
                layout
                key={act.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: i * 0.06 }}
                className="flex items-center gap-4 bg-bg-secondary p-3 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                <div className={`p-3 rounded-xl ${bg} ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm flex-1 min-w-0">
                  <p className="font-bold text-text-primary truncate">{act.text}</p>
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
