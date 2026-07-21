"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Star, Gift, Clock } from "lucide-react";
import type { Quest } from "../../data/quests";
import { Ripple } from "./Ripple";
import { useSFX } from "../../hooks/useSFX";
import confetti from "canvas-confetti";
import { useState } from "react";

interface QuestCardProps {
  quest: Quest;
  onClaim?: (id: string) => void;
}

export function QuestCard({ quest, onClaim }: QuestCardProps) {
  const sfx = useSFX();
  const [isClaimed, setIsClaimed] = useState(quest.claimed);
  
  const isCompleted = quest.progress.current >= quest.progress.target;
  const progressPercent = Math.min(
    (quest.progress.current / quest.progress.target) * 100, 
    100
  );

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted && !isClaimed) {
      sfx.success();
      setIsClaimed(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#35d07f", "#fbcc5c", "#ffffff"]
      });
      if (onClaim) onClaim(quest.id);
    }
  };

  const getIcon = () => {
    switch (quest.type) {
      case "daily": return <Clock className="w-5 h-5 text-blue-500" />;
      case "weekly": return <Star className="w-5 h-5 text-celo-gold" />;
      case "one-time": return <Gift className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`relative glass-panel rounded-2xl p-4 overflow-hidden transition-colors ${
        isClaimed ? "opacity-60 bg-bg-secondary border-transparent" : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex gap-4">
        <div className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm ${
          isClaimed ? "bg-bg-primary" : "bg-white dark:bg-gray-800"
        }`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-sm text-text-primary truncate">{quest.title}</h3>
            <span className="text-[10px] font-bold text-celo-gold bg-celo-gold/10 px-2 py-0.5 rounded-full whitespace-nowrap">
              +{quest.reward} XP
            </span>
          </div>
          
          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            {quest.description}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase mb-1.5 tracking-wider">
                <span>Progress</span>
                <span>{quest.progress.current} / {quest.progress.target}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.2, type: "spring" }}
                  className={`h-full rounded-full ${isCompleted ? "bg-celo-green" : "bg-blue-500"}`}
                />
              </div>
            </div>

            {isClaimed ? (
              <button disabled className="shrink-0 flex items-center justify-center gap-1 text-[10px] font-bold text-celo-green bg-celo-green/10 px-3 py-1.5 rounded-xl border border-transparent">
                <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
              </button>
            ) : isCompleted ? (
              <Ripple className="shrink-0 rounded-xl" as="div">
                <button 
                  onClick={handleClaim}
                  className="w-full h-full flex items-center justify-center gap-1 text-[10px] font-bold text-white bg-celo-green hover:bg-[#2ebf73] px-3 py-1.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(53,208,127,0.39)]"
                >
                  Claim
                </button>
              </Ripple>
            ) : (
              <button disabled className="shrink-0 flex items-center justify-center gap-1 text-[10px] font-bold text-text-muted bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-transparent">
                Locked
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
