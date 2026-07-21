"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Ripple } from "../components/ui/Ripple";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center bg-bg-primary">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex max-w-sm flex-col items-center gap-4 glass-panel rounded-3xl p-8"
      >
        <div className="rounded-full bg-bg-secondary p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-celo-green/10 rounded-full animate-ping opacity-50" />
          <Search className="h-8 w-8 text-celo-green relative z-10" />
        </div>
        
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-text-primary tracking-tight">404 - Lost!</h2>
          <p className="text-sm font-medium text-text-secondary leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>
        
        <div className="w-full mt-4">
          <Ripple className="w-full rounded-2xl">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-celo-green px-6 py-4 font-bold text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(53,208,127,0.23)] hover:bg-[#2ebf73]"
            >
              Return to Pot
            </Link>
          </Ripple>
        </div>
      </motion.div>
    </div>
  );
}
