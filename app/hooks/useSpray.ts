"use client";

import { useCallback, useEffect, useState } from "react";
import { isAddress } from "viem";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

/** The owambe spray: gift a sponsor-backed ticket. Works against the live v3 faucet. */
export function useSpray() {
  const { address } = useWallet();
  const [spraysLeft, setSpraysLeft] = useState<bigint>(0n);
  const [dailyFreeLeft, setDailyFreeLeft] = useState<bigint>(0n);
  const [verified, setVerified] = useState(false);
  const [spraying, setSpraying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    if (!address) return;
    void (async () => {
      try {
        const [left, freeLeft, v] = await Promise.all([
          publicClient.readContract({
            ...contracts.sprayFaucet,
            functionName: "dailySpraysLeft",
            args: [address],
          }),
          publicClient.readContract({
            ...contracts.sprayFaucet,
            functionName: "dailyFreeLeft",
            args: [address],
          }),
          publicClient.readContract({
            ...contracts.sprayFaucet,
            functionName: "isVerified",
            args: [address],
          }),
        ]);
        setSpraysLeft(left);
        setDailyFreeLeft(freeLeft);
        setVerified(v);
      } catch {
        /* keep previous values */
      }
    })();
  }, [address]);

  useEffect(refetch, [refetch]);

  const spray = useCallback(
    async (friend: string) => {
      const wallet = walletClient();
      if (!wallet || !address) return;
      if (!isAddress(friend)) {
        setError("That doesn't look like a wallet address.");
        return;
      }
      setSpraying(true);
      setError(undefined);
      setDone(false);
      try {
        const { request } = await publicClient.simulateContract({
          ...contracts.sprayFaucet,
          functionName: "spray",
          args: [friend],
          account: address,
        });
        const hash = await wallet.writeContract({
          ...request,
          feeCurrency: isMiniPay() ? contracts.cusd.address : undefined,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setDone(true);
        refetch();
      } catch (e) {
        const m = e instanceof Error ? e.message.split("\n")[0] : "Spray failed";
        setError(
          m.includes("NotVerified")
            ? "You and your friend both need verified accounts to spray."
            : m,
        );
      } finally {
        setSpraying(false);
      }
    },
    [address, refetch],
  );

  return { spraysLeft, dailyFreeLeft, verified, spray, spraying, done, error };
}
