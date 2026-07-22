"use client";

import { useCallback, useEffect, useState } from "react";
import { stringToHex, hexToString } from "viem";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts, crewsEnabled } from "../lib/contracts";
import { useWallet } from "./useWallet";

const POLL_MS = 20_000;

/** Human code <-> bytes32 on-chain code. */
const toCode = (s: string) => stringToHex(s.trim().toLowerCase().slice(0, 31), { size: 32 });
const fromCode = (b: `0x${string}`) => hexToString(b, { size: 32 }).replace(/\0+$/, "");

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL ?? "";

interface CrewMember {
  address: string;
  joinedAt: number;
}

export interface CrewState {
  enabled: boolean;
  crewId: bigint;
  myCode: string; // "" when not in a crew
  memberCount: bigint;
  savingsToday: bigint;
  members: CrewMember[];
  loading: boolean;
}

export function useCrew() {
  const { address } = useWallet();
  const [state, setState] = useState<CrewState>({
    enabled: crewsEnabled,
    crewId: 0n,
    myCode: "",
    memberCount: 0n,
    savingsToday: 0n,
    members: [],
    loading: crewsEnabled,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    if (!crewsEnabled || !address) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    void (async () => {
      try {
        const [crewId, codeB32, period] = await Promise.all([
          publicClient.readContract({
            ...contracts.crewRegistry,
            functionName: "crewOf",
            args: [address],
          }),
          publicClient.readContract({
            ...contracts.crewRegistry,
            functionName: "codeOf",
            args: [address],
          }),
          publicClient.readContract({ ...contracts.potVault, functionName: "currentPeriod" }),
        ]);
        let memberCount = 0n;
        let savingsToday = 0n;
        let members: CrewMember[] = [];

        if (crewId !== 0n) {
          [memberCount, savingsToday] = await Promise.all([
            publicClient.readContract({
              ...contracts.crewRegistry,
              functionName: "memberCount",
              args: [crewId],
            }),
            publicClient.readContract({
              ...contracts.crewRegistry,
              functionName: "crewSavings",
              args: [crewId, period],
            }),
          ]);

          if (INDEXER_URL) {
            try {
              const res = await fetch(`${INDEXER_URL}/crews/${crewId.toString()}`, {
                signal: AbortSignal.timeout(8_000),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.members) {
                  members = data.members.map((m: any) => ({
                    address: m.address,
                    joinedAt: Number(m.joinedAt),
                  }));
                }
              }
            } catch {
              // Ignore indexer errors, just keep members empty
            }
          }
        }
        setState({
          enabled: true,
          crewId,
          myCode: crewId !== 0n ? fromCode(codeB32) : "",
          memberCount,
          savingsToday,
          members,
          loading: false,
        });
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    })();
  }, [address]);

  useEffect(() => {
    refetch();
    if (!crewsEnabled) return;
    const t = setInterval(refetch, POLL_MS);
    return () => clearInterval(t);
  }, [refetch]);

  const write = useCallback(
    async (functionName: "createCrew" | "joinCrew", args: readonly `0x${string}`[]) => {
      const wallet = walletClient();
      if (!wallet || !address) return;
      setBusy(true);
      setError(undefined);
      try {
        const { request } = await publicClient.simulateContract({
          ...contracts.crewRegistry,
          functionName,
          args: args as never,
          account: address,
        });
        const hash = await wallet.writeContract({
          ...request,
          feeCurrency: isMiniPay() ? contracts.cusd.address : undefined,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message.split("\n")[0] : "Transaction failed");
      } finally {
        setBusy(false);
      }
    },
    [address, refetch],
  );

  const createCrew = (myCode: string) => write("createCrew", [toCode(myCode)]);
  const joinCrew = (inviterCode: string, myCode: string) =>
    write("joinCrew", [toCode(inviterCode), toCode(myCode)]);

  return { ...state, createCrew, joinCrew, busy, error, refetch };
}
