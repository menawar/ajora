"use client";

import { useCallback, useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { publicClient } from "../lib/clients";
import { contracts } from "../lib/contracts";

const contributedEvent = parseAbiItem(
  "event Contributed(address indexed user, uint256 indexed periodId, uint256 amount, uint256 ticketsMinted)",
);

const CHUNK = 5_000n; // stay well under public-RPC getLogs range limits
const BATCH = 3; // parallel chunk requests

export interface SaverRow {
  address: `0x${string}`;
  total: bigint;
}

/**
 * Today's top savers, aggregated client-side from Contributed logs filtered by
 * the period topic. One-shot fetch with manual refresh — the indexer (#14)
 * replaces this with a proper query.
 */
export function useTopSavers(limit = 10) {
  const [rows, setRows] = useState<SaverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refetch = useCallback(() => {
    setLoading(true);
    setError(undefined);
    void (async () => {
      try {
        const periodId = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "currentPeriod",
        });
        const latest = await publicClient.getBlock();
        // ~1s Celo blocks: walk back to the period boundary with a safety margin.
        const sinceStart = latest.timestamp - periodId * 86_400n;
        const fromBlock =
          latest.number > sinceStart + 600n ? latest.number - sinceStart - 600n : 0n;

        // Chunked range scan, BATCH chunks at a time.
        const ranges: Array<[bigint, bigint]> = [];
        for (let from = fromBlock; from <= latest.number; from += CHUNK) {
          const to = from + CHUNK - 1n < latest.number ? from + CHUNK - 1n : latest.number;
          ranges.push([from, to]);
        }
        const totals = new Map<string, bigint>();
        for (let i = 0; i < ranges.length; i += BATCH) {
          const logs = await Promise.all(
            ranges.slice(i, i + BATCH).map(([from, to]) =>
              publicClient.getLogs({
                address: contracts.potVault.address,
                event: contributedEvent,
                args: { periodId },
                fromBlock: from,
                toBlock: to,
              }),
            ),
          );
          for (const log of logs.flat()) {
            const user = log.args.user!;
            totals.set(user, (totals.get(user) ?? 0n) + (log.args.amount ?? 0n));
          }
        }

        const sorted = [...totals.entries()]
          .map(([address, total]) => ({ address: address as `0x${string}`, total }))
          .sort((a, b) => (b.total > a.total ? 1 : -1))
          .slice(0, limit);
        setRows(sorted);
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message.split("\n")[0] : "Failed to load");
        setLoading(false);
      }
    })();
  }, [limit]);

  useEffect(refetch, [refetch]);
  return { rows, loading, error, refetch };
}
