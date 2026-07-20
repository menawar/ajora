import { useState, useEffect } from "react";

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL ?? "";

export interface GlobalMetrics {
  tvl: string;
  totalJaraPaid: string;
  totalUsers: number;
}

export interface DailyMetric {
  day: bigint;
  date: string;
  dau: number;
  newUsers: number;
  txCount: number;
  principalIn: string;
  jaraPaid: string;
  referrals: number;
  kFactor: number;
  retentionD1: number | null;
  retentionD7: number | null;
}

export function useMetrics() {
  const [global, setGlobal] = useState<GlobalMetrics | null>(null);
  const [daily, setDaily] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [globalRes, dailyRes] = await Promise.all([
          fetch(`${INDEXER_URL}/metrics/global`),
          fetch(`${INDEXER_URL}/metrics/daily?days=30`)
        ]);
        
        if (globalRes.ok) {
          const globalData = await globalRes.json();
          setGlobal(globalData);
        }
        
        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          // daily.json returns { days: number, rows: DailyMetric[] }
          setDaily(dailyData.rows ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return { global, daily, loading };
}
