"use client";

import { useOnline } from "../hooks/useOnline";

/** Thin top banner shown only while offline, so cached screens don't look broken. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-3 py-1.5 text-center text-xs font-medium text-white"
    >
      📴 You’re offline — showing your last saved data.
    </div>
  );
}
