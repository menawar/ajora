"use client";

import { useEffect, useState, useCallback } from "react";
import { playPop, playClick, playSuccess } from "../lib/audio";

export function useSFX() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Load preference from localStorage
    const pref = localStorage.getItem("ajora-sfx");
    if (pref !== null) {
      setEnabled(pref === "true");
    } else {
      // Default to true
      setEnabled(true);
      localStorage.setItem("ajora-sfx", "true");
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("ajora-sfx", String(next));
      if (next) playPop(); // Play a test sound when enabled
      return next;
    });
  }, []);

  const pop = useCallback(() => {
    if (enabled) playPop();
  }, [enabled]);

  const click = useCallback(() => {
    if (enabled) playClick();
  }, [enabled]);

  const success = useCallback(() => {
    if (enabled) playSuccess();
  }, [enabled]);

  return { enabled, toggle, pop, click, success };
}
