"use client";
import { trackEvent, AnalyticsEvents } from "../lib/analytics";

import { useCallback, useEffect, useState } from "react";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

/** How many recent periods (days) the wallet screen lists. */
const LOOKBACK = 14;
/** How many periods to scan for the all-time total. */
const ALLTIME_LOOKBACK = 30;
const POLL_MS = 15_000;

export interface SavingsEntry {
  periodId: bigint;
  principal: bigint;
  isToday: boolean;
}

/** Per-period principal for the last 14 days, plus the no-loss claim write. */
export function useSavings() {
  const { address } = useWallet();
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [totalAllTime, setTotalAllTime] = useState(0n);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<bigint>();
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    if (!address) {
      setLoading(false);
      setEntries([]);
      return;
    }
    void (async () => {
      try {
        const current = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "currentPeriod",
        });
        const ids = Array.from({ length: LOOKBACK }, (_, i) => current - BigInt(i));
        const principals = await Promise.all(
          ids.map((periodId) =>
            publicClient.readContract({
              ...contracts.potVault,
              functionName: "principalOf",
              args: [address, periodId],
            }),
          ),
        );
        const filtered = ids
          .map((periodId, i) => ({
            periodId,
            principal: principals[i],
            isToday: periodId === current,
          }))
          .filter((e) => e.principal > 0n);
        setEntries(filtered);

        // Scan a wider window for all-time total
        const allTimeIds = Array.from({ length: ALLTIME_LOOKBACK }, (_, i) => current - BigInt(i));
        const allTimePrincipals = await Promise.all(
          allTimeIds.map((periodId) =>
            publicClient.readContract({
              ...contracts.potVault,
              functionName: "principalOf",
              args: [address, periodId],
            }).catch(() => 0n),
          ),
        );
        setTotalAllTime(allTimePrincipals.reduce((sum, p) => sum + p, 0n));
        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
  }, [address]);

  useEffect(() => {
    refetch();
    const t = setInterval(refetch, POLL_MS);
    return () => clearInterval(t);
  }, [refetch]);


  const claimPrincipal = useCallback(
    async (periodId: bigint) => {
      const wallet = walletClient();
      if (!wallet || !address) return;
      setClaiming(periodId);
      setError(undefined);
      trackEvent(AnalyticsEvents.WITHDRAW_INITIATED, { periodId: periodId.toString() });
      try {
        const feeCurrency = isMiniPay() ? contracts.cusd.address : undefined;
        const hash = await wallet.writeContract({
          ...contracts.potVault,
          functionName: "claimPrincipal",
          args: [periodId],
          account: address,
          chain: publicClient.chain,
          feeCurrency,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        trackEvent(AnalyticsEvents.WITHDRAW_COMPLETED, { periodId: periodId.toString() });
        refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message.split("\n")[0] : "Withdrawal failed");
      } finally {
        setClaiming(undefined);
      }
    },
    [address, refetch],
  );

  const total = entries.reduce((sum, e) => sum + e.principal, 0n);
  return { entries, total, totalAllTime, loading, claimPrincipal, claiming, error };
}
