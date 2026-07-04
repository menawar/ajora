"use client";

import { useCallback, useEffect, useState } from "react";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

/** How many recent periods (days) the wallet screen lists. */
const LOOKBACK = 7;
const POLL_MS = 15_000;

export interface SavingsEntry {
  periodId: bigint;
  principal: bigint;
  isToday: boolean;
}

/** Per-period principal for the last week, plus the no-loss claim write. */
export function useSavings() {
  const { address } = useWallet();
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
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
        setEntries(
          ids
            .map((periodId, i) => ({
              periodId,
              principal: principals[i],
              isToday: periodId === current,
            }))
            .filter((e) => e.principal > 0n),
        );
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
  return { entries, total, loading, claimPrincipal, claiming, error };
}
