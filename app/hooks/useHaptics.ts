"use client";

import { useCallback } from "react";

export function useHaptics() {
  const isSupported = typeof window !== "undefined" && "vibrate" in navigator;

  const lightTap = useCallback(() => {
    if (isSupported) navigator.vibrate(10);
  }, [isSupported]);

  const mediumTap = useCallback(() => {
    if (isSupported) navigator.vibrate(30);
  }, [isSupported]);

  const heavyTap = useCallback(() => {
    if (isSupported) navigator.vibrate(50);
  }, [isSupported]);

  const successTap = useCallback(() => {
    if (isSupported) navigator.vibrate([20, 50, 20]);
  }, [isSupported]);

  const errorTap = useCallback(() => {
    if (isSupported) navigator.vibrate([50, 50, 50]);
  }, [isSupported]);

  return { lightTap, mediumTap, heavyTap, successTap, errorTap };
}
