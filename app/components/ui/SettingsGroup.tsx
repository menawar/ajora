"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
  delay?: number;
}

export function SettingsGroup({ title, children, delay = 0 }: SettingsGroupProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col gap-2"
    >
      <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted px-4">
        {title}
      </h2>
      <div className="glass-panel rounded-3xl overflow-hidden flex flex-col">
        {children}
      </div>
    </motion.section>
  );
}
