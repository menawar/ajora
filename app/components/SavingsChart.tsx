"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { motion } from "framer-motion";
import type { SavingsEntry } from "../hooks/useSavings";

interface SavingsChartProps {
  entries: SavingsEntry[];
  loading?: boolean;
  className?: string;
}

function cusd(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

function dayShort(periodId: bigint): string {
  const date = new Date(Number(periodId) * 86_400_000);
  return date.toLocaleDateString("en", { weekday: "short" }).slice(0, 1);
}

export function SavingsChart({ entries, loading = false, className = "" }: SavingsChartProps) {
  const { points, maxVal, pathD, total, avg } = useMemo(() => {
    if (entries.length === 0) return { points: [], maxVal: 0n, pathD: "", total: 0n, avg: 0n };

    // Sort entries oldest → newest
    const sorted = [...entries].sort((a, b) => Number(a.periodId - b.periodId));
    const maxVal = sorted.reduce((max, e) => (e.principal > max ? e.principal : max), 0n);
    const total = sorted.reduce((sum, e) => sum + e.principal, 0n);
    const avg = sorted.length > 0 ? total / BigInt(sorted.length) : 0n;

    const W = 280;
    const H = 80;
    const pad = 8;

    const points = sorted.map((e, i) => {
      const x = pad + (i / Math.max(sorted.length - 1, 1)) * (W - pad * 2);
      const y = maxVal > 0n
        ? H - pad - (Number(e.principal * BigInt(H - pad * 2)) / Number(maxVal))
        : H / 2;
      return { x, y, entry: e };
    });

    // Build smooth SVG path using cardinal spline
    const pathD = points.length < 2
      ? ""
      : points.map((p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = points[i - 1];
          const cpx = (prev.x + p.x) / 2;
          return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
        }).join(" ");

    return { points, maxVal, pathD, total, avg };
  }, [entries]);

  if (loading) {
    return (
      <div className={`glass-panel rounded-3xl p-5 ${className}`}>
        <div className="h-20 animate-pulse bg-bg-secondary rounded-xl" />
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <div className={`glass-panel rounded-3xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-5 bg-celo-green rounded-full block" />
          Savings Trend
        </h2>
        <div className="text-right">
          <div className="text-xs text-text-muted font-medium">Avg / day</div>
          <div className="text-sm font-black text-celo-green">{cusd(avg)} cUSD</div>
        </div>
      </div>

      {/* SVG Sparkline */}
      <div className="w-full overflow-hidden">
        <svg viewBox="0 0 280 80" className="w-full h-20" preserveAspectRatio="none">
          {/* Area fill */}
          {pathD && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} 80 L ${points[0].x} 80 Z`}
              fill="url(#savingsGrad)"
              opacity={0.15}
            />
          )}
          <defs>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#35d07f" />
              <stop offset="100%" stopColor="#35d07f" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Animated line */}
          {pathD && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="#35d07f"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          )}
          {/* Data points */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill="#35d07f"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + i * 0.05 }}
            />
          ))}
        </svg>
      </div>

      {/* Day labels */}
      {entries.length > 1 && (
        <div className="flex justify-between mt-1 px-2">
          {[...entries]
            .sort((a, b) => Number(a.periodId - b.periodId))
            .map((e) => (
              <span key={e.periodId.toString()} className="text-[10px] font-bold text-text-muted">
                {dayShort(e.periodId)}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
