"use client";

import { useOnline } from "../hooks/useOnline";

import { AnimatePresence, motion } from "framer-motion";

/** Thin top banner shown only while offline, so cached screens don't look broken. */
export function OfflineBanner() {
  const online = useOnline();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-3 py-1.5 text-center text-xs font-medium text-white shadow-md shadow-amber-500/20"
        >
          📴 You’re offline — showing your last saved data.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
