"use client";

import { useCallback, useEffect, useState } from "react";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";
import { trackEvent, AnalyticsEvents } from "../lib/analytics";

const LOOKBACK = 14;
const POLL_MS = 20_000;

export interface WinningsEntry {
  periodId: bigint;
  amount: bigint;
}

export function useWinnings() {
  const { address } = useWallet();
  const [entries, setEntries] = useState<WinningsEntry[]>([]);
  const [total, setTotal] = useState(0n);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<bigint>();
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    if (!address) {
      setLoading(false);
      setEntries([]);
      setTotal(0n);
      return;
    }
    void (async () => {
      try {
        const current = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "currentPeriod",
        });
        // Scan past periods for unclaimed winnings
        const ids = Array.from({ length: LOOKBACK }, (_, i) => current - BigInt(i + 1));
        const amounts = await Promise.all(
          ids.map((periodId) =>
            publicClient.readContract({
              ...contracts.potVault,
              functionName: "principalOf", // winnings stored in _winnings mapping, read via claimWinnings simulation
              args: [address, periodId],
            }).catch(() => 0n),
          ),
        );
        // Note: the contract exposes winnings via claimWinnings; we check by simulating
        const winningsResults = await Promise.allSettled(
          ids.map((periodId) =>
            publicClient.simulateContract({
              ...contracts.potVault,
              functionName: "claimWinnings",
              args: [periodId],
              account: address,
            }),
          ),
        );
        const winningsEntries: WinningsEntry[] = [];
        let totalWinnings = 0n;
        for (let i = 0; i < ids.length; i++) {
          const result = winningsResults[i];
          if (result.status === "fulfilled") {
            const amount = result.value.result as bigint;
            if (amount > 0n) {
              winningsEntries.push({ periodId: ids[i], amount });
              totalWinnings += amount;
            }
          }
        }
        setEntries(winningsEntries);
        setTotal(totalWinnings);
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

  const claimWinnings = useCallback(
    async (periodId: bigint) => {
      const wallet = walletClient();
      if (!wallet || !address) return;
      setClaiming(periodId);
      setError(undefined);
      trackEvent(AnalyticsEvents.WITHDRAW_INITIATED, { periodId: periodId.toString(), type: "winnings" });
      try {
        const feeCurrency = isMiniPay() ? contracts.cusd.address : undefined;
        const hash = await wallet.writeContract({
          ...contracts.potVault,
          functionName: "claimWinnings",
          args: [periodId],
          account: address,
          chain: publicClient.chain,
          feeCurrency,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        trackEvent(AnalyticsEvents.WITHDRAW_COMPLETED, { periodId: periodId.toString(), type: "winnings" });
        refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message.split("\n")[0] : "Claim failed");
      } finally {
        setClaiming(undefined);
      }
    },
    [address, refetch],
  );

  return { entries, total, loading, claimWinnings, claiming, error, refetch };
}
