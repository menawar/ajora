"use client";

import { useCallback, useEffect, useState } from "react";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

const POLL_MS = 30_000;

export interface StreakState {
  streakDays: bigint;
  /** Scaled by 10: 10 = 1.0x, 15 = 1.5x. */
  multiplierX10: bigint;
  /** True once the user has checked in during the current day window. */
  checkedInToday: boolean;
  loading: boolean;
}

/** Live streak + multiplier for the connected account, with the daily check-in write. */
export function useStreak() {
  const { address } = useWallet();
  const [state, setState] = useState<StreakState>({
    streakDays: 0n,
    multiplierX10: 10n,
    checkedInToday: false,
    loading: true,
  });
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    if (!address) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    void (async () => {
      try {
        const [streakDays, multiplierX10] = await Promise.all([
          publicClient.readContract({
            ...contracts.streakSBT,
            functionName: "streakOf",
            args: [address],
          }),
          publicClient.readContract({
            ...contracts.streakSBT,
            functionName: "multiplierOf",
            args: [address],
          }),
        ]);
        // Checked in today iff a same-day checkIn would revert AlreadyCheckedIn.
        let checkedInToday = false;
        try {
          await publicClient.simulateContract({
            ...contracts.streakSBT,
            functionName: "checkIn",
            account: address,
          });
        } catch {
          checkedInToday = true;
        }
        setState({ streakDays, multiplierX10, checkedInToday, loading: false });
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    })();
  }, [address]);

  useEffect(() => {
    refetch();
    const t = setInterval(refetch, POLL_MS);
    return () => clearInterval(t);
  }, [refetch]);

  const checkIn = useCallback(async () => {
    const wallet = walletClient();
    if (!wallet || !address) return;
    setCheckingIn(true);
    setError(undefined);
    try {
      const feeCurrency = isMiniPay() ? contracts.cusd.address : undefined;
      const hash = await wallet.writeContract({
        ...contracts.streakSBT,
        functionName: "checkIn",
        account: address,
        chain: publicClient.chain,
        feeCurrency,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message.split("\n")[0] : "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  }, [address, refetch]);

  return { ...state, checkIn, checkingIn, error, refetch };
}
