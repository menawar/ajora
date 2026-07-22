"use client";

import { useEffect, useRef, useState } from "react";

/** "2h 05m", then "4m 32s" inside the final hour — precision when it matters. */
function formatRemaining(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m ${(s % 60).toString().padStart(2, "0")}s`;
}

/**
 * Live countdown to an absolute unix time (#95). Ticks every second from the
 * device clock, so it never goes stale or negative between RPC polls, and fires
 * onExpire exactly once per rollover so the caller can refetch the new period.
 */
export function Countdown({ closeAt, onExpire }: { closeAt: number; onExpire?: () => void }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const expiredFor = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (closeAt > 0 && now >= closeAt && expiredFor.current !== closeAt) {
      expiredFor.current = closeAt;
      onExpire?.();
    }
  }, [now, closeAt, onExpire]);

  if (closeAt === 0) return <span>…</span>;
  if (now >= closeAt) return <span>rolling over…</span>;
  return <span>{formatRemaining(closeAt - now)}</span>;
}

/** The close moment in the viewer's own clock (00:00 UTC ≈ 1 AM WAT / 3 AM EAT). */
export function localCloseTime(closeAt: number): string {
  if (closeAt === 0) return "";
  return new Date(closeAt * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
