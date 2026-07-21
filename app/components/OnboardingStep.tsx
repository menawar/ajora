"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface OnboardingStepProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  highlightColor?: "green" | "gold" | "purple";
}

const colorStyles = {
  green: "from-celo-green/20 to-celo-green/5 text-celo-green border-celo-green/30",
  gold: "from-celo-gold/20 to-amber-100/5 text-amber-500 border-celo-gold/30",
  purple: "from-purple-500/20 to-purple-100/5 text-purple-500 border-purple-500/30",
};

export function OnboardingStep({
  title,
  subtitle,
  icon,
  highlightColor = "green",
}: OnboardingStepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-8 h-[340px]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className={`w-32 h-32 rounded-[2rem] flex items-center justify-center bg-gradient-to-br border mb-6 shadow-xl ${colorStyles[highlightColor]}`}
      >
        {icon}
      </motion.div>
      <motion.h2
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-black text-text-primary mb-2 tracking-tight"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium text-text-secondary leading-relaxed max-w-[240px]"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
