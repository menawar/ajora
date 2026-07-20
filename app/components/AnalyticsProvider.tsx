"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "../hooks/useWallet";
import { trackEvent, AnalyticsEvents } from "../lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();
  const isConnected = !!address;
  const prevConnected = useRef(false);

  useEffect(() => {
    if (isConnected && !prevConnected.current && address) {
      trackEvent(AnalyticsEvents.WALLET_CONNECTED, { address });
      prevConnected.current = true;
    } else if (!isConnected && prevConnected.current) {
      trackEvent(AnalyticsEvents.WALLET_DISCONNECTED);
      prevConnected.current = false;
    }
  }, [isConnected, address]);

  return <>{children}</>;
}
