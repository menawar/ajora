"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // ms
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/** Animated number counter that smoothly counts from `from` to `to`. */
export function CountUp({
  to,
  from = 0,
  duration = 1200,
  decimals = 0,
  className = "",
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const [display, setDisplay] = useState(from);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = from;
    const endVal = to;
    if (startVal === endVal) { setDisplay(endVal); return; }

    function step(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startVal + (endVal - startVal) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(endVal);
      }
    }

    startRef.current = null;
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, from, duration]);

  const formatted = display.toLocaleString("en", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
