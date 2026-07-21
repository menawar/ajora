"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const MOCK_WINNERS = [
  { address: "0x1234...5678", amount: "52.40", date: "2h ago" },
  { address: "0x8765...4321", amount: "120.00", date: "5h ago" },
  { address: "0xabcd...efgh", amount: "15.75", date: "1d ago" },
  { address: "0x9999...0000", amount: "8.50", date: "1d ago" },
  { address: "0x5555...4444", amount: "210.20", date: "2d ago" },
];

export function RecentWinnersFeed() {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
          <Trophy className="w-4 h-4 text-celo-gold" />
          Recent Winners
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-celo-green bg-celo-green/10 px-2 py-0.5 rounded-md">Live</span>
      </div>
      
      {/* Marquee Container */}
      <div className="relative flex overflow-x-hidden w-full bg-bg-secondary/30 py-4 mask-edges">
        <motion.div
          className="flex whitespace-nowrap gap-4 px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 20, repeat: Infinity }}
        >
          {/* Double the list for seamless infinite loop */}
          {[...MOCK_WINNERS, ...MOCK_WINNERS].map((w, i) => (
            <div key={i} className="flex items-center gap-3 bg-bg-primary rounded-xl px-4 py-2 shadow-sm border border-gray-100 dark:border-gray-800 shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-celo-gold to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                {w.address.slice(2, 4)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-medium text-text-secondary">{w.address}</span>
                <span className="text-sm font-black text-text-primary">+{w.amount} <span className="text-[10px] text-text-muted font-bold">cUSD</span></span>
              </div>
              <span className="text-[10px] text-text-muted ml-2">{w.date}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
