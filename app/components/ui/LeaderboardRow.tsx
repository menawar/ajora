"use client";

import { motion } from "framer-motion";
import { Avatar } from "./Avatar";
import { Trophy, TrendingUp, Users } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { formatUnits } from "viem";

export type LeaderboardCategory = "savers" | "streaks" | "crews";

interface LeaderboardRowProps {
  rank: number;
  address: string;
  score: number;
  category: LeaderboardCategory;
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ rank, address, score, category, isCurrentUser }: LeaderboardRowProps) {
  const { address: myAddress } = useWallet();
  
  // If isCurrentUser is passed true, or the address exactly matches
  const highlight = isCurrentUser || (myAddress && address.toLowerCase() === myAddress.toLowerCase());

  const getRankStyle = () => {
    if (rank === 1) return "text-amber-500 bg-amber-500/10 border-amber-500/30 font-black";
    if (rank === 2) return "text-gray-400 bg-gray-400/10 border-gray-400/30 font-black";
    if (rank === 3) return "text-[#cd7f32] bg-[#cd7f32]/10 border-[#cd7f32]/30 font-black";
    return "text-text-muted bg-bg-secondary font-bold border-transparent";
  };

  const getScoreDisplay = () => {
    switch (category) {
      case "savers": 
        return <span className="text-celo-green font-bold">{score.toLocaleString("en")} cUSD</span>;
      case "streaks":
        return <span className="text-orange-500 font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {score} Days</span>;
      case "crews":
        return <span className="text-blue-500 font-bold flex items-center gap-1"><Users className="w-3 h-3" /> {score} Members</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(rank * 0.05, 0.5), type: "spring", stiffness: 300, damping: 24 }}
      className={`flex items-center gap-4 p-3 rounded-2xl border transition-colors ${
        highlight 
          ? "glass-panel border-celo-green/50 shadow-[0_0_15px_rgba(53,208,127,0.15)] ring-1 ring-celo-green/20" 
          : "border-gray-100 dark:border-gray-800 hover:bg-bg-secondary/50"
      }`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs border ${getRankStyle()}`}>
        {rank <= 3 ? <Trophy className="w-4 h-4" /> : `#${rank}`}
      </div>
      
      <div className="shrink-0">
        <Avatar address={address} size={36} />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className={`text-sm font-bold truncate ${highlight ? "text-celo-green" : "text-text-primary"}`}>
          {highlight ? "You" : `${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
          Rank {rank}
        </span>
      </div>
      
      <div className="shrink-0 text-right flex flex-col justify-center">
        <span className="text-sm">
          {getScoreDisplay()}
        </span>
      </div>
    </motion.div>
  );
}
