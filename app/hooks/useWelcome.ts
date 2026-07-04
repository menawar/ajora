"use client";

import { useCallback, useEffect, useState } from "react";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

export interface WelcomeState {
  /** Faucet has already issued this account's one-time welcome ticket. */
  welcomed: boolean;
  /** Identity attested by the verifier (phone verification / Self, #18). */
  verified: boolean;
  loading: boolean;
}

/** Zero-deposit onboarding: welcome-ticket eligibility + the permissionless claim. */
export function useWelcome() {
  const { address } = useWallet();
  const [state, setState] = useState<WelcomeState>({
    welcomed: false,
    verified: false,
    loading: true,
  });
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    if (!address) {
      setState({ welcomed: false, verified: false, loading: false });
      return;
    }
    void (async () => {
      try {
        const [welcomed, verified] = await Promise.all([
          publicClient.readContract({
            ...contracts.sprayFaucet,
            functionName: "welcomed",
            args: [address],
          }),
          publicClient.readContract({
            ...contracts.sprayFaucet,
            functionName: "isVerified",
            args: [address],
          }),
        ]);
        setState({ welcomed, verified, loading: false });
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    })();
  }, [address]);

  useEffect(refetch, [refetch]);

  const claim = useCallback(async () => {
    const wallet = walletClient();
    if (!wallet || !address) return;
    setClaiming(true);
    setError(undefined);
    try {
      const { request } = await publicClient.simulateContract({
        ...contracts.sprayFaucet,
        functionName: "welcomeTicket",
        args: [address],
        account: address,
      });
      const hash = await wallet.writeContract({
        ...request,
        feeCurrency: isMiniPay() ? contracts.cusd.address : undefined,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message.split("\n")[0] : "Claim failed");
    } finally {
      setClaiming(false);
    }
  }, [address, refetch]);

  return { ...state, claim, claiming, error, refetch };
}
