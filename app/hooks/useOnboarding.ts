"use client";

import { useState, useEffect } from "react";

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true); // default true to avoid flash before load
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("ajora-has-seen-onboarding");
    if (!seen) {
      setHasSeenOnboarding(false);
    }
    setIsLoaded(true);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("ajora-has-seen-onboarding", "true");
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("ajora-has-seen-onboarding");
    setHasSeenOnboarding(false);
  };

  return { hasSeenOnboarding, isLoaded, completeOnboarding, resetOnboarding };
}
