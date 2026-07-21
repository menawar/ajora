"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: "green" | "gold" | "gray" | "gradient";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const variantClass: Record<NonNullable<ProgressBarProps["variant"]>, string> = {
  green: "bg-celo-green",
  gold: "bg-celo-gold",
  gray: "bg-gray-300 dark:bg-gray-600",
  gradient: "bg-gradient-to-r from-celo-green to-celo-gold",
};

const sizeClass: Record<NonNullable<ProgressBarProps["size"]>, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  max = 100,
  variant = "green",
  size = "md",
  showLabel = false,
  label,
  className = "",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-text-secondary">
          {label && <span>{label}</span>}
          {showLabel && <span className="ml-auto">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full ${sizeClass[size]} rounded-full bg-bg-secondary overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${variantClass[variant]}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </div>
  );
}
