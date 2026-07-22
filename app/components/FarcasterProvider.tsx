"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // SDK methods like isInMiniApp are async in newer SDK versions
        const context = await sdk.context;
        // If context resolves, we are in a Farcaster MiniApp
        if (context) {
          // Set the ethereum provider globally so clients.ts can pick it up synchronously
          (window as any).farcasterProvider = sdk.wallet.ethProvider;
          
          // Signal Farcaster that the app is ready to display
          await sdk.actions.ready();
          console.log("Farcaster MiniApp SDK initialized");
        }
      } catch (e) {
        // Not in a MiniApp, continue as normal web app
        console.debug("Not in a Farcaster MiniApp");
      } finally {
        setIsReady(true);
      }
    };
    
    initFarcaster();
  }, []);

  // Prevent hydration errors by ensuring we've at least checked the context
  // before rendering the children that might immediately ask for a wallet connection.
  if (!isReady) return null;

  return <>{children}</>;
}
