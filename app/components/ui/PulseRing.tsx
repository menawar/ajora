"use client";

import { motion } from "framer-motion";

interface PulseRingProps {
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

/** Pulsing concentric ring animation for status indicators or winning highlights. */
export function PulseRing({ color = "#35d07f", size = "md", className = "" }: PulseRingProps) {
  return (
    <span className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
      <span className="relative z-10 rounded-full w-3 h-3" style={{ background: color }} />
    </span>
  );
}
