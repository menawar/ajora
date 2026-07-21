"use client";

import { useEffect, useState, useCallback } from "react";
import { playPop, playClick, playSuccess } from "../lib/audio";
import { useHaptics } from "./useHaptics";

export function useSFX() {
  const [enabled, setEnabled] = useState(false);
  const haptics = useHaptics();

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
    haptics.lightTap();
    if (enabled) playPop();
  }, [enabled, haptics]);

  const click = useCallback(() => {
    haptics.mediumTap();
    if (enabled) playClick();
  }, [enabled, haptics]);

  const success = useCallback(() => {
    haptics.successTap();
    if (enabled) playSuccess();
  }, [enabled, haptics]);

  return { enabled, toggle, pop, click, success };
}
