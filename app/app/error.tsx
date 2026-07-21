"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Ripple } from "../components/ui/Ripple";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to an error reporting service here
    console.error("App boundary error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center bg-bg-primary">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex max-w-sm flex-col items-center gap-4 glass-panel rounded-3xl p-8 border-red-500/20"
      >
        <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-5 relative overflow-hidden">
          <AlertOctagon className="h-8 w-8 text-red-500 relative z-10" />
        </div>
        
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Something went wrong</h2>
          <p className="text-sm font-medium text-text-secondary leading-relaxed">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        
        <div className="w-full mt-4 flex flex-col gap-3">
          <Ripple className="w-full rounded-2xl">
            <button
              onClick={() => reset()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-celo-green px-6 py-4 font-bold text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(53,208,127,0.23)] hover:bg-[#2ebf73]"
            >
              <RefreshCw className="w-5 h-5" /> Try Again
            </button>
          </Ripple>
          
          <button
            onClick={() => window.location.href = "/"}
            className="text-sm font-bold text-text-muted hover:text-text-primary transition-colors py-2"
          >
            Go back Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
