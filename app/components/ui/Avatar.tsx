"use client";

import { useMemo } from "react";

interface AvatarProps {
  address: string;
  size?: number | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: 24,
  md: 40,
  lg: 64,
};

// Simple color palettes
const PALETTES = [
  ["#35d07f", "#fbcc5c", "#f3f4f6"], // Ajora theme
  ["#ff7e67", "#f9f871", "#00c9b1"],
  ["#a8e6cf", "#dcedc1", "#ffd3b6"],
  ["#ff9a9e", "#fecfef", "#a1c4fd"],
  ["#667eea", "#764ba2", "#e0c3fc"]
];

/**
 * Deterministic SVG Avatar generator based on wallet address.
 */
export function Avatar({ address, size = 40, className = "" }: AvatarProps) {
  const numSize = typeof size === "string" ? SIZE_MAP[size] : size;

  const { bg, fg, shape1, shape2 } = useMemo(() => {
    // Generate a simple hash from the address
    const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const palette = PALETTES[hash % PALETTES.length];
    
    return {
      bg: palette[0],
      fg: palette[1],
      shape1: palette[2],
      shape2: palette[hash % 3] // Mix it up
    };
  }, [address]);

  return (
    <div 
      className={`rounded-full overflow-hidden shrink-0 border-2 border-bg-secondary ${className}`} 
      style={{ width: numSize, height: numSize, backgroundColor: bg }}
    >
      <svg width={numSize} height={numSize} viewBox={`0 0 ${numSize} ${numSize}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx={numSize / 2} cy={numSize / 2} r={numSize * 0.4} fill={fg} />
        <rect x={numSize * 0.2} y={numSize * 0.6} width={numSize * 0.6} height={numSize * 0.4} rx={numSize * 0.2} fill={shape1} />
        <circle cx={numSize * 0.7} cy={numSize * 0.3} r={numSize * 0.15} fill={shape2} />
      </svg>
    </div>
  );
}
