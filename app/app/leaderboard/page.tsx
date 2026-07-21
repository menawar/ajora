"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Trophy, Search, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LeaderboardRow, type LeaderboardCategory } from "../../components/ui/LeaderboardRow";
import { useWallet } from "../../hooks/useWallet";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// Seeded RNG to mock consistent data
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generateMockData(category: LeaderboardCategory) {
  const mock = [];
  const baseScore = category === "savers" ? 50000 : category === "streaks" ? 150 : 25;
  
  for (let i = 1; i <= 20; i++) {
    const hex = Math.floor(seededRandom(i * (category.length)) * 16777215).toString(16).padStart(6, '0');
    const hex2 = Math.floor(seededRandom(i * (category.length) + 1) * 16777215).toString(16).padStart(6, '0');
    const address = `0x${hex}0000000000000000000000000000000000${hex2}`;
    
    const multiplier = 1 - (i * 0.04);
    const score = Math.max(Math.floor(baseScore * multiplier), 1);
    
    mock.push({ rank: i, address, score });
  }
  return mock;
}

export default function LeaderboardPage() {
  const [category, setCategory] = useState<LeaderboardCategory>("savers");
  const [data, setData] = useState<{ rank: number; address: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useWallet();

  useEffect(() => {
    let active = true;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?category=${category}&limit=20`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (active) setData(json);
      } catch (err) {
        console.error("API failed, falling back to mock data", err);
        if (active) setData(generateMockData(category));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLeaderboard();
    return () => { active = false; };
  }, [category]);

  const tabs: { id: LeaderboardCategory; label: string; icon: React.ReactNode }[] = [
    { id: "savers", label: "Top Savers", icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: "streaks", label: "Streaks", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: "crews", label: "Crews", icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <motion.main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary relative"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="pt-4 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gradient flex items-center gap-3">
            Leaderboard
          </h1>
        </div>
      </motion.header>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex p-1 bg-bg-secondary rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              category === tab.id 
                ? "bg-bg-primary text-text-primary shadow-sm" 
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Main List */}
      <motion.section variants={itemVariants} className="flex flex-col gap-2 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-celo-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm font-medium">
            No data available yet.
          </div>
        ) : (
          data.map((row) => (
            <LeaderboardRow 
              key={`${category}-${row.rank}`} 
              rank={row.rank} 
              address={row.address} 
              score={row.score} 
              category={category} 
            />
          ))
        )}
      </motion.section>

      {/* Sticky Current User Row */}
      {address && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.5 }}
          className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-6 z-20 pointer-events-none"
        >
          <div className="pointer-events-auto">
            <LeaderboardRow 
              rank={142} 
              address={address} 
              score={category === "savers" ? 150 : category === "streaks" ? 2 : 1} 
              category={category}
              isCurrentUser={true}
            />
          </div>
        </motion.div>
      )}
    </motion.main>
  );
}
