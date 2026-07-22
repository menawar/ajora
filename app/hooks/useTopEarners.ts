"use client";

import { useCallback, useEffect, useState } from "react";
import { readCache, writeCache } from "../lib/offline";
import { useOnline } from "./useOnline";

export interface EarnerRow {
  address: `0x${string}`;
  total: bigint; // xp
  username?: string;
  avatar_url?: string;
}

export function useTopEarners(limit = 100) {
  const [rows, setRows] = useState<EarnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const online = useOnline();

  const refetch = useCallback(() => {
    const cacheKey = `topEarners:${limit}`;
    setLoading(true);
    setError(undefined);

    void (async () => {
      try {
        const res = await fetch(`/api/leaderboard?category=xp&limit=${limit}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        
        const data = await res.json();
        const parsedRows = data.rows.map((r: any) => ({
          ...r,
          total: BigInt(r.total)
        }));

        setRows(parsedRows);
        writeCache(cacheKey, parsedRows);
        setLoading(false);
      } catch (e: any) {
        const cached = readCache<EarnerRow[]>(cacheKey);
        if (cached) {
          setRows(cached.value);
        } else {
          setError(e.message || "Failed to load XP leaderboard");
        }
        setLoading(false);
      }
    })();
  }, [limit]);

  useEffect(() => {
    const cached = readCache<EarnerRow[]>(`topEarners:${limit}`);
    if (cached) {
      setRows(cached.value);
    }
  }, [limit]);

  useEffect(refetch, [refetch]);

  useEffect(() => {
    if (online) refetch();
  }, [online, refetch]);

  return { rows, loading, error, refetch };
}
