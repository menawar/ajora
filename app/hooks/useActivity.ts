"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUnits, parseAbiItem } from "viem";
import { publicClient } from "../lib/clients";
import { contracts } from "../lib/contracts";
import { useWallet } from "./useWallet";

/** ~4 000 Celo blocks ≈ last ~66 minutes at ~1 s/block */
const RECENT_BLOCKS = 4_000n;

const contributedEvent = parseAbiItem(
  "event Contributed(address indexed user, uint256 indexed periodId, uint256 amount, uint256 ticketsMinted)",
);
const checkedInEvent = parseAbiItem(
  "event CheckedIn(address indexed user, uint256 streakDays, uint256 multiplierX10)",
);
const prizeClaimedEvent = parseAbiItem(
  "event PrizeClaimed(address indexed user, uint256 indexed periodId, uint256 amount)",
);

export interface ActivityItem {
  id: string;
  type: "save" | "checkin" | "win";
  text: string;
  time: string;
  /** unix ms */
  ts: number;
}

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function cusd(value: bigint): string {
  const n = Number(formatUnits(value, 18));
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

/**
 * Builds a real activity feed for the connected wallet from recent on-chain events:
 *  - Contributed → "Saved X cUSD"
 *  - CheckedIn   → "Day N streak check-in"
 *  - PrizeClaimed → "Won X cUSD 🎉"
 *
 * Returns up to 10 items, newest-first. Falls back to [] on error/no wallet.
 */
export function useActivity() {
  const { address } = useWallet();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!address) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const latest = await publicClient.getBlockNumber();
        const fromBlock = latest > RECENT_BLOCKS ? latest - RECENT_BLOCKS : 0n;

        const [saveLogs, checkinLogs, winLogs] = await Promise.all([
          publicClient.getLogs({
            address: contracts.potVault.address,
            event: contributedEvent,
            args: { user: address },
            fromBlock,
            toBlock: latest,
          }),
          publicClient.getLogs({
            address: contracts.streakSBT.address,
            event: checkedInEvent,
            args: { user: address },
            fromBlock,
            toBlock: latest,
          }),
          publicClient.getLogs({
            address: contracts.drawManager.address,
            event: prizeClaimedEvent,
            args: { user: address },
            fromBlock,
            toBlock: latest,
          }),
        ]);

        // Fetch block timestamps for all unique block numbers
        const blockNums = [
          ...new Set([
            ...saveLogs.map((l) => l.blockNumber),
            ...checkinLogs.map((l) => l.blockNumber),
            ...winLogs.map((l) => l.blockNumber),
          ].filter((n): n is bigint => n !== null)),
        ];
        const blockTimes = new Map<bigint, number>();
        await Promise.all(
          blockNums.map(async (n) => {
            const blk = await publicClient.getBlock({ blockNumber: n });
            blockTimes.set(n, Number(blk.timestamp) * 1000);
          }),
        );

        const allItems: ActivityItem[] = [];

        for (const log of saveLogs) {
          const ts = blockTimes.get(log.blockNumber!) ?? Date.now();
          const amount = log.args.amount ?? 0n;
          allItems.push({
            id: `save-${log.transactionHash}-${log.logIndex}`,
            type: "save",
            text: `Saved ${cusd(amount)} cUSD`,
            time: timeAgo(ts),
            ts,
          });
        }

        for (const log of checkinLogs) {
          const ts = blockTimes.get(log.blockNumber!) ?? Date.now();
          const days = log.args.streakDays ?? 0n;
          allItems.push({
            id: `checkin-${log.transactionHash}-${log.logIndex}`,
            type: "checkin",
            text: `Day ${days.toString()} streak check-in 🔥`,
            time: timeAgo(ts),
            ts,
          });
        }

        for (const log of winLogs) {
          const ts = blockTimes.get(log.blockNumber!) ?? Date.now();
          const amount = log.args.amount ?? 0n;
          allItems.push({
            id: `win-${log.transactionHash}-${log.logIndex}`,
            type: "win",
            text: `Won ${cusd(amount)} cUSD 🎉`,
            time: timeAgo(ts),
            ts,
          });
        }

        // Sort newest-first, cap at 10
        allItems.sort((a, b) => b.ts - a.ts);
        setItems(allItems.slice(0, 10));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, loading, refetch };
}
