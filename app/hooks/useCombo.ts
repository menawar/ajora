"use client";

import { useCallback, useState } from "react";
import { parseUnits } from "viem";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

export type ComboStep = "idle" | "approving" | "saving" | "picking" | "checking_in" | "success" | "error";

/**
 * Optimistic sequential UX orchestrator for #92 (MiniPay multicall spike fallback).
 * Executes Save -> Pick -> Check-in sequentially, presenting a unified progress flow.
 */
export function useCombo() {
  const { address } = useWallet();
  const [step, setStep] = useState<ComboStep>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();

  const execute = useCallback(async (amountCusd: string, pickNumber: number) => {
    const wallet = walletClient();
    if (!wallet || !address) {
      setStep("error");
      setError("Wallet not connected");
      return;
    }
    
    setError(undefined);
    setProgress(0);
    const amount = parseUnits(amountCusd, 18);
    const feeCurrency = isMiniPay() ? contracts.cusd.address : undefined;

    try {
      // 1. Approve & Save
      const allowance = await publicClient.readContract({
        ...contracts.cusd,
        functionName: "allowance",
        args: [address, contracts.potVault.address],
      });

      if (allowance < amount) {
        setStep("approving");
        setProgress(10);
        const approveHash = await wallet.writeContract({
          ...contracts.cusd,
          functionName: "approve",
          args: [contracts.potVault.address, amount],
          account: address,
          chain: publicClient.chain,
          feeCurrency,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      setStep("saving");
      setProgress(30);
      const { request: saveReq } = await publicClient.simulateContract({
        ...contracts.potVault,
        functionName: "contribute",
        args: [amount],
        account: address,
      });
      const saveHash = await wallet.writeContract({ ...saveReq, feeCurrency });
      await publicClient.waitForTransactionReceipt({ hash: saveHash });

      // 2. Pick
      setStep("picking");
      setProgress(60);
      const { request: pickReq } = await publicClient.simulateContract({
        ...contracts.drawManager,
        functionName: "pickNumber",
        args: [pickNumber],
        account: address,
      });
      const pickHash = await wallet.writeContract({ ...pickReq, feeCurrency });
      await publicClient.waitForTransactionReceipt({ hash: pickHash });

      // 3. Check-in
      setStep("checking_in");
      setProgress(85);
      try {
        const { request: checkInReq } = await publicClient.simulateContract({
          ...contracts.streakSBT,
          functionName: "checkIn",
          account: address,
        });
        const checkInHash = await wallet.writeContract({ ...checkInReq, feeCurrency });
        await publicClient.waitForTransactionReceipt({ hash: checkInHash });
      } catch (e) {
        // Expected if already checked in today; continue to success.
      }

      setStep("success");
      setProgress(100);
    } catch (e) {
      let message = "Transaction failed";
      if (e instanceof Error) {
        if (e.message.includes("User rejected") || e.message.includes("denied transaction signature")) {
          message = "Transaction was rejected in your wallet. Please try again.";
        } else {
          message = e.message.split("\n")[0];
        }
      }
      setError(message);
      setStep("error");
    }
  }, [address]);

  return { execute, step, progress, error, reset: () => { setStep("idle"); setProgress(0); setError(undefined); } };
}
