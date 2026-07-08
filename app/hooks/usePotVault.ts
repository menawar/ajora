"use client";

import { useCallback, useEffect, useState } from "react";
import { parseUnits } from "viem";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { chain } from "../lib/chain";
import { useWallet } from "./useWallet";

const POLL_MS = 10_000;

export interface PotToday {
  periodId: bigint;
  jaraPot: bigint;
  totalTickets: bigint;
  myTickets: bigint;
  myPrincipal: bigint;
  /** Seconds until the current period closes (00:00 UTC) and the draw can run. */
  secondsToClose: number;
  /** Absolute close time (unix seconds) — tick countdowns from this, not from
   *  secondsToClose, which decays between polls (#95). */
  closeAt: number;
  loading: boolean;
}

/** Live view of today's pot, polled from the public RPC (works with no wallet). */
export function usePotToday(): PotToday & { refetch: () => void } {
  const { address } = useWallet();
  const [state, setState] = useState<PotToday>({
    periodId: 0n,
    jaraPot: 0n,
    totalTickets: 0n,
    myTickets: 0n,
    myPrincipal: 0n,
    secondsToClose: 0,
    closeAt: 0,
    loading: true,
  });

  const refetch = useCallback(() => {
    void (async () => {
      try {
        const periodId = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "currentPeriod",
        });
        const [info, myTickets, myPrincipal] = await Promise.all([
          publicClient.readContract({
            ...contracts.potVault,
            functionName: "periodInfo",
            args: [periodId],
          }),
          address
            ? publicClient.readContract({
                ...contracts.potVault,
                functionName: "ticketsOf",
                args: [address, periodId],
              })
            : Promise.resolve(0n),
          address
            ? publicClient.readContract({
                ...contracts.potVault,
                functionName: "principalOf",
                args: [address, periodId],
              })
            : Promise.resolve(0n),
        ]);
        const closeAt = (Number(periodId) + 1) * 86_400;
        setState({
          periodId,
          jaraPot: info.jaraPot,
          totalTickets: info.totalTickets,
          myTickets,
          myPrincipal,
          secondsToClose: Math.max(0, closeAt - Math.floor(Date.now() / 1000)),
          closeAt,
          loading: false,
        });
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

  return { ...state, refetch };
}

export type TxStatus =
  | { step: "idle" }
  | { step: "approving" }
  | { step: "saving" }
  | { step: "success"; txHash: `0x${string}`; tickets: bigint }
  | { step: "error"; message: string };

/**
 * Save flow: approve cUSD if needed, then contribute. Inside MiniPay, gas is
 * paid in cUSD via Celo's feeCurrency (MiniPay holds no CELO by design).
 */
export function useSave() {
  const { address } = useWallet();
  const [status, setStatus] = useState<TxStatus>({ step: "idle" });

  const save = useCallback(
    async (amountCusd: string) => {
      const wallet = walletClient();
      if (!wallet || !address) {
        setStatus({ step: "error", message: "Open Ajora inside MiniPay to save." });
        return;
      }
      const amount = parseUnits(amountCusd, 18);
      // MetaMask & friends don't understand Celo's custom fee-currency tx type.
      const feeCurrency = isMiniPay() ? contracts.cusd.address : undefined;

      try {
        const allowance = await publicClient.readContract({
          ...contracts.cusd,
          functionName: "allowance",
          args: [address, contracts.potVault.address],
        });
        if (allowance < amount) {
          setStatus({ step: "approving" });
          const approveHash = await wallet.writeContract({
            ...contracts.cusd,
            functionName: "approve",
            args: [contracts.potVault.address, amount],
            account: address,
            chain,
            feeCurrency,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        setStatus({ step: "saving" });
        const { request, result } = await publicClient.simulateContract({
          ...contracts.potVault,
          functionName: "contribute",
          args: [amount],
          account: address,
        });
        const txHash = await wallet.writeContract({ ...request, feeCurrency });
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        setStatus({ step: "success", txHash, tickets: result });
      } catch (e) {
        const message = e instanceof Error ? e.message.split("\n")[0] : "Transaction failed";
        setStatus({ step: "error", message });
      }
    },
    [address],
  );

  const reset = useCallback(() => setStatus({ step: "idle" }), []);
  return { save, status, reset };
}

export type SponsorStatus =
  | { step: "idle" }
  | { step: "approving" }
  | { step: "funding" }
  | { step: "success"; txHash: `0x${string}` }
  | { step: "error"; message: string };

/**
 * Sponsor flow: approve cUSD if needed, then fundJara(currentPeriod, amount).
 * fundJara is permissionless (spec §6) — anyone can top up tonight's pot, and
 * the full amount is paid out to winners.
 */
export function useSponsor() {
  const { address } = useWallet();
  const [status, setStatus] = useState<SponsorStatus>({ step: "idle" });

  const sponsor = useCallback(
    async (amountCusd: string) => {
      const wallet = walletClient();
      if (!wallet || !address) {
        setStatus({ step: "error", message: "Open Ajora inside MiniPay to sponsor." });
        return;
      }
      const amount = parseUnits(amountCusd, 18);
      const feeCurrency = isMiniPay() ? contracts.cusd.address : undefined;

      try {
        const allowance = await publicClient.readContract({
          ...contracts.cusd,
          functionName: "allowance",
          args: [address, contracts.potVault.address],
        });
        if (allowance < amount) {
          setStatus({ step: "approving" });
          const approveHash = await wallet.writeContract({
            ...contracts.cusd,
            functionName: "approve",
            args: [contracts.potVault.address, amount],
            account: address,
            chain,
            feeCurrency,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        setStatus({ step: "funding" });
        // Read the period at send time — a polled value can straddle midnight UTC
        // and would credit yesterday's pot instead of tonight's.
        const periodId = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "currentPeriod",
        });
        const { request } = await publicClient.simulateContract({
          ...contracts.potVault,
          functionName: "fundJara",
          args: [periodId, amount],
          account: address,
        });
        const txHash = await wallet.writeContract({ ...request, feeCurrency });
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        setStatus({ step: "success", txHash });
      } catch (e) {
        const message = e instanceof Error ? e.message.split("\n")[0] : "Transaction failed";
        setStatus({ step: "error", message });
      }
    },
    [address],
  );

  const reset = useCallback(() => setStatus({ step: "idle" }), []);
  return { sponsor, status, reset };
}
