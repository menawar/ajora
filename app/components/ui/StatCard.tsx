"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { TiltCard } from "./TiltCard";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  subtitle?: string;
  trend?: { value: number; label: string };
  delay?: number;
}

export function StatCard({ title, value, icon, subtitle, trend, delay = 0 }: StatCardProps) {
  return (
    <TiltCard>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
      className="glass-panel rounded-3xl p-5 flex flex-col gap-2 relative overflow-hidden group"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-celo-green/10 transition-colors pointer-events-none" />
      
      <div className="flex items-center justify-between text-text-muted">
        <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
        {icon && <div className="text-text-secondary">{icon}</div>}
      </div>
      
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-3xl font-black text-text-primary tracking-tight">{value}</div>
      </div>
      
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs font-medium">
          {subtitle && <span className="text-text-secondary">{subtitle}</span>}
          {trend && (
            <span className={`px-2 py-1 rounded-md ${trend.value >= 0 ? "bg-celo-green/10 text-celo-green" : "bg-red-500/10 text-red-500"}`}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </span>
          )}
        </div>
      )}
      </motion.div>
    </TiltCard>
  );
}
