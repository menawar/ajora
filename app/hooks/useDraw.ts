"use client";

import { useCallback, useEffect, useState } from "react";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

const POLL_MS = 12_000;

export interface MyPick {
  number: number; // 0 = no pick
  weight: bigint;
}

export interface LastDraw {
  periodId: bigint;
  resolved: boolean;
  winningNumber: number;
  pot: bigint;
  totalWinningWeight: bigint;
  /** Connected user's state for that draw. */
  won: boolean;
  claimed: boolean;
  /** Pro-rata prize if won and unclaimed (0 otherwise). */
  prize: bigint;
}

/** Current-period pick state + last night's draw, polled from the public RPC. */
export function useDraw() {
  const { address } = useWallet();
  const [myPick, setMyPick] = useState<MyPick>({ number: 0, weight: 0n });
  const [last, setLast] = useState<LastDraw>();
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    void (async () => {
      try {
        const period = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "currentPeriod",
        });
        const lastPeriod = period - 1n;

        const [pick, draw] = await Promise.all([
          address
            ? publicClient.readContract({
                ...contracts.drawManager,
                functionName: "pickOf",
                args: [address, period],
              })
            : Promise.resolve([0, 0n] as const),
          publicClient.readContract({
            ...contracts.drawManager,
            functionName: "drawOf",
            args: [lastPeriod],
          }),
        ]);

        let won = false;
        let claimed = false;
        let prize = 0n;
        if (address && draw.resolved && draw.totalWinningWeight > 0n) {
          const [isWinner, hasClaimed, lastPick] = await Promise.all([
            publicClient.readContract({
              ...contracts.drawManager,
              functionName: "isWinner",
              args: [address, lastPeriod],
            }),
            publicClient.readContract({
              ...contracts.drawManager,
              functionName: "claimed",
              args: [address, lastPeriod],
            }),
            publicClient.readContract({
              ...contracts.drawManager,
              functionName: "pickOf",
              args: [address, lastPeriod],
            }),
          ]);
          won = isWinner;
          claimed = hasClaimed;
          if (won && !claimed) {
            prize = (draw.pot * lastPick[1]) / draw.totalWinningWeight;
          }
        }

        setMyPick({ number: Number(pick[0]), weight: pick[1] });
        setLast({
          periodId: lastPeriod,
          resolved: draw.resolved,
          winningNumber: Number(draw.winningNumber),
          pot: draw.pot,
          totalWinningWeight: draw.totalWinningWeight,
          won,
          claimed,
          prize,
        });
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

  const feeCurrency = () => (isMiniPay() ? contracts.cusd.address : undefined);

  const pick = useCallback(
    async (number: number) => {
      const wallet = walletClient();
      if (!wallet || !address) return;
      setPicking(true);
      setError(undefined);
      try {
        const { request } = await publicClient.simulateContract({
          ...contracts.drawManager,
          functionName: "pickNumber",
          args: [number],
          account: address,
        });
        const hash = await wallet.writeContract({ ...request, feeCurrency: feeCurrency() });
        await publicClient.waitForTransactionReceipt({ hash });
        refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message.split("\n")[0] : "Pick failed");
      } finally {
        setPicking(false);
      }
    },
    [address, refetch],
  );

  const claimPrize = useCallback(async () => {
    const wallet = walletClient();
    if (!wallet || !address || !last) return;
    setClaiming(true);
    setError(undefined);
    try {
      // claimPrize settles into the vault; claimWinnings pays out — do both.
      const { request } = await publicClient.simulateContract({
        ...contracts.drawManager,
        functionName: "claimPrize",
        args: [last.periodId],
        account: address,
      });
      const h1 = await wallet.writeContract({ ...request, feeCurrency: feeCurrency() });
      await publicClient.waitForTransactionReceipt({ hash: h1 });

      const h2 = await wallet.writeContract({
        ...contracts.potVault,
        functionName: "claimWinnings",
        args: [last.periodId],
        account: address,
        chain: publicClient.chain,
        feeCurrency: feeCurrency(),
      });
      await publicClient.waitForTransactionReceipt({ hash: h2 });
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message.split("\n")[0] : "Claim failed");
    } finally {
      setClaiming(false);
    }
  }, [address, last, refetch]);

  return { myPick, last, loading, pick, picking, claimPrize, claiming, error, refetch };
}
