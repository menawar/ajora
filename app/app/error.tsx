"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-xl border border-gray-100"
      >
        <div className="rounded-full bg-red-100 p-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900">Oops, something broke!</h2>
          <p className="mt-2 text-sm text-gray-500">
            We ran into an unexpected issue while loading this page. Our team has been notified.
          </p>
        </div>
        
        <Button
          onClick={() => reset()}
          className="mt-4 flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" /> Try again
        </Button>
      </motion.div>
    </div>
  );
}
