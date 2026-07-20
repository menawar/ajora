"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { trackEvent, AnalyticsEvents } from "../lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
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
