"use client";
import { trackEvent, AnalyticsEvents } from "../lib/analytics";

import { useCallback, useEffect, useState } from "react";
import { useCachedState } from "./useCachedState";
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
  /** Milestone badges (7, 30, 90) currently owned by the user. */
  badges: number[];
  loading: boolean;
}

/** Live streak + multiplier for the connected account, with the daily check-in write. */
export function useStreak() {
  const { address } = useWallet();
  const [state, setState] = useCachedState<StreakState>("ajora:streak", {
    streakDays: 0n,
    multiplierX10: 10n,
    checkedInToday: false,
    badges: [],
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
        const [streakDays, multiplierX10, b7, b30, b90] = await Promise.all([
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
          publicClient.readContract({
            ...contracts.streakSBT,
            functionName: "hasBadge",
            args: [address, 7n],
          }),
          publicClient.readContract({
            ...contracts.streakSBT,
            functionName: "hasBadge",
            args: [address, 30n],
          }),
          publicClient.readContract({
            ...contracts.streakSBT,
            functionName: "hasBadge",
            args: [address, 90n],
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

        const badges = [];
        if (b7) badges.push(7);
        if (b30) badges.push(30);
        if (b90) badges.push(90);

        setState({ streakDays, multiplierX10, checkedInToday, badges, loading: false });
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
      trackEvent(AnalyticsEvents.STREAK_CHECKIN);
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message.split("\n")[0] : "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  }, [address, refetch]);

  return { ...state, checkIn, checkingIn, error, refetch };
}
