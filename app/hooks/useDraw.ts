"use client";

import { useCallback, useEffect, useState } from "react";
import { encodeAbiParameters, isHex, keccak256, parseAbiItem } from "viem";
import { publicClient, walletClient, isMiniPay } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

const POLL_MS = 12_000;
type Address = `0x${string}`;
const numberPickedEvent = parseAbiItem(
  "event NumberPicked(address indexed user, uint256 indexed periodId, uint8 number, uint256 weight)",
);

export interface MyPick {
  number: number; // 0 = no pick
  weight: bigint;
}

export interface LastDraw {
  periodId: bigint;
  resolved: boolean;
  winningNumber: number;
  resolvedAt: bigint;
  pot: bigint;
  totalWinningWeight: bigint;
  /** Connected user's state for that draw. */
  won: boolean;
  claimed: boolean;
  /** Pro-rata prize when won (claimed or not; 0 otherwise). */
  prize: bigint;
  /** True once the claim window has elapsed and the leftover pot can be recycled. */
  canRecycle: boolean;
  /** Public winner list from the indexer when available. */
  winners: Array<{ address: Address; share: bigint; claimed: boolean }>;
}

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL ?? "";

async function fetchWinnersFromChain(periodId: bigint, winningNumber: number) {
  const latest = await publicClient.getBlockNumber();
  const fromBlock = latest > 120_000n ? latest - 120_000n : 0n;
  const chunk = 5_000n;
  const winners = new Map<Address, { address: Address; share: bigint; claimed: boolean }>();

  for (let start = fromBlock; start <= latest; start += chunk) {
    const end = start + chunk - 1n < latest ? start + chunk - 1n : latest;
    const logs = await publicClient.getLogs({
      ...contracts.drawManager,
      event: numberPickedEvent,
      args: { periodId },
      fromBlock: start,
      toBlock: end,
    });
    for (const log of logs) {
      if (log.args.number !== winningNumber || !log.args.user || !log.args.weight) continue;
      const address = log.args.user as Address;
      winners.set(address, { address, share: log.args.weight, claimed: false });
    }
  }

  return [...winners.values()];
}

/** Current-period pick state + last night's draw, polled from the public RPC. */
export function useDraw() {
  const { address } = useWallet();
  const [myPick, setMyPick] = useState<MyPick>({ number: 0, weight: 0n });
  const [last, setLast] = useState<LastDraw>();
  const [keeper, setKeeper] = useState<Address>();
  const [admin, setAdmin] = useState<Address>();
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [recycling, setRecycling] = useState(false);
  const [recovering, setRecovering] = useState<"idle" | "recommitting" | "revealing">("idle");
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    void (async () => {
      try {
        const period = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "currentPeriod",
        });
        const lastPeriod = period - 1n;

        const [keeperAddress, adminAddress, currentPick, draw] = await Promise.all([
          publicClient.readContract({
            ...contracts.drawManager,
            functionName: "keeper",
          }),
          publicClient.readContract({
            ...contracts.drawManager,
            functionName: "admin",
          }),
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
        const claimWindow = await publicClient.readContract({
          ...contracts.drawManager,
          functionName: "CLAIM_WINDOW",
        });
        setKeeper(keeperAddress as Address);
        setAdmin(adminAddress as Address);

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
          if (won) {
            prize = (draw.pot * lastPick[1]) / draw.totalWinningWeight;
          }
        }

        setMyPick({ number: Number(currentPick[0]), weight: currentPick[1] });
        setLast({
          periodId: lastPeriod,
          resolved: draw.resolved,
          winningNumber: Number(draw.winningNumber),
          resolvedAt: draw.resolvedAt,
          pot: draw.pot,
          totalWinningWeight: draw.totalWinningWeight,
          won,
          claimed,
          prize,
          canRecycle:
            draw.resolved &&
            draw.totalWinningWeight > 0n &&
            BigInt(Math.floor(Date.now() / 1000)) >= draw.resolvedAt + claimWindow,
          winners: [],
        });

        if (draw.resolved && draw.totalWinningWeight > 0n) {
          try {
            let winners: Array<{ address: Address; share: bigint; claimed: boolean }> = [];
            if (INDEXER_URL) {
              const res = await fetch(`${INDEXER_URL}/periods/${lastPeriod.toString()}`, {
                signal: AbortSignal.timeout(8_000),
              });
              if (res.ok) {
                const data = (await res.json()) as {
                  winners?: Array<{ address: Address; share: string; claimed: boolean }>;
                };
                winners = (data.winners ?? []).map((w) => ({
                  address: w.address,
                  share: BigInt(w.share),
                  claimed: w.claimed,
                }));
              }
            }

            if (winners.length === 0) {
              winners = await fetchWinnersFromChain(lastPeriod, Number(draw.winningNumber));
            }

            if (winners.length > 0) {
              setLast((curr) => (curr ? { ...curr, winners } : curr));
            }
          } catch {
            // Keep the on-chain state even if the indexer is unavailable.
          }
        }
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

  const assertBytes32Hex = (secret: string): `0x${string}` => {
    if (!isHex(secret, { strict: true }) || secret.length !== 66) {
      throw new Error("Paste the keeper secret as a 32-byte 0x-prefixed hex value.");
    }
    return secret as `0x${string}`;
  };

  const commitmentFromSecret = (secret: string): `0x${string}` => {
    return keccak256(encodeAbiParameters([{ type: "bytes32" }], [assertBytes32Hex(secret)]));
  };

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

  const recycleUnclaimed = useCallback(async () => {
    const wallet = walletClient();
    if (!wallet || !address || !last || !last.canRecycle) return;
    setRecycling(true);
    setError(undefined);
    try {
      const { request } = await publicClient.simulateContract({
        ...contracts.drawManager,
        functionName: "recycleUnclaimed",
        args: [last.periodId],
        account: address,
      });
      const hash = await wallet.writeContract({ ...request, feeCurrency: feeCurrency() });
      await publicClient.waitForTransactionReceipt({ hash });
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message.split("\n")[0] : "Rollover failed");
    } finally {
      setRecycling(false);
    }
  }, [address, last, refetch]);

  const recommitMissedDraw = useCallback(
    async (periodId: bigint, secret: string) => {
      const wallet = walletClient();
      if (!wallet || !address) return;
      setRecovering("recommitting");
      setError(undefined);
      try {
        const commitment = commitmentFromSecret(secret);
        const { request } = await publicClient.simulateContract({
          ...contracts.drawManager,
          functionName: "recommitSeed",
          args: [periodId, commitment],
          account: address,
        });
        const hash = await wallet.writeContract({ ...request, feeCurrency: feeCurrency() });
        await publicClient.waitForTransactionReceipt({ hash });
        refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message.split("\n")[0] : "Recommit failed");
      } finally {
        setRecovering("idle");
      }
    },
    [address, refetch],
  );

  const revealMissedDraw = useCallback(
    async (periodId: bigint, secret: string) => {
      const wallet = walletClient();
      if (!wallet || !address) return;
      setRecovering("revealing");
      setError(undefined);
      try {
        const keeperSecret = assertBytes32Hex(secret);
        const { request } = await publicClient.simulateContract({
          ...contracts.drawManager,
          functionName: "revealAndResolve",
          args: [periodId, keeperSecret],
          account: address,
        });
        const hash = await wallet.writeContract({ ...request, feeCurrency: feeCurrency() });
        await publicClient.waitForTransactionReceipt({ hash });
        refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message.split("\n")[0] : "Reveal failed");
      } finally {
        setRecovering("idle");
      }
    },
    [address, refetch],
  );

  return {
    myPick,
    last,
    keeper,
    admin,
    loading,
    pick,
    picking,
    claimPrize,
    claiming,
    recycleUnclaimed,
    recycling,
    recommitMissedDraw,
    revealMissedDraw,
    recovering,
    error,
    refetch,
  };
}
