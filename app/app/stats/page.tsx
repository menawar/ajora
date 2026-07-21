"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Activity, Users, Coins, Loader2 } from "lucide-react";
import { formatUnits, parseAbiItem } from "viem";
import { StatCard } from "../../components/ui/StatCard";
import { RecentWinnersFeed } from "../../components/RecentWinnersFeed";
import { CountUp } from "../../components/ui/CountUp";
import { usePotToday } from "../../hooks/usePotVault";
import { publicClient } from "../../lib/clients";
import { contracts } from "../../lib/contracts";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

/** Unique Contributed emitters across a 30-day block window. */
const contributedEvent = parseAbiItem(
  "event Contributed(address indexed user, uint256 indexed periodId, uint256 amount, uint256 ticketsMinted)",
);

interface GlobalStats {
  tvl: number;       // cUSD
  savers: number;    // unique addresses
  avgPot: number;    // cUSD, avg of last 7 resolved draws
  loading: boolean;
}

function useGlobalStats(): GlobalStats {
  const [stats, setStats] = useState<GlobalStats>({ tvl: 0, savers: 0, avgPot: 0, loading: true });

  const fetchStats = useCallback(() => {
    void (async () => {
      try {
        const periodId = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "currentPeriod",
        });

        // 1. Real TVL — totalPrincipalOutstanding()
        const tvlRaw = await publicClient.readContract({
          ...contracts.potVault,
          functionName: "totalPrincipalOutstanding",
        });
        const tvl = Number(formatUnits(tvlRaw, 18));

        // 2. Unique savers — distinct user addresses from Contributed logs over ~30 days
        //    ~30 days × 86_400 blocks ≈ 2_592_000. Cap at 100_000 for RPC budget.
        const latest = await publicClient.getBlockNumber();
        const fromBlock = latest > 100_000n ? latest - 100_000n : 0n;
        const chunk = 10_000n;
        const uniqueUsers = new Set<string>();
        for (let start = fromBlock; start <= latest; start += chunk) {
          const end = start + chunk - 1n < latest ? start + chunk - 1n : latest;
          const logs = await publicClient.getLogs({
            address: contracts.potVault.address,
            event: contributedEvent,
            fromBlock: start,
            toBlock: end,
          });
          for (const log of logs) {
            if (log.args.user) uniqueUsers.add(log.args.user.toLowerCase());
          }
        }
        const savers = uniqueUsers.size;

        // 3. Average pot from last 7 resolved draws
        const drawIds = Array.from({ length: 7 }, (_, i) => periodId - BigInt(i + 1)).filter(
          (id) => id >= 0n,
        );
        const draws = await Promise.all(
          drawIds.map((id) =>
            publicClient
              .readContract({ ...contracts.drawManager, functionName: "drawOf", args: [id] })
              .catch(() => null),
          ),
        );
        const resolvedPots = draws
          .filter((d): d is NonNullable<typeof d> => d !== null && d.resolved && d.pot > 0n)
          .map((d) => Number(formatUnits(d.pot, 18)));
        const avgPot =
          resolvedPots.length > 0
            ? resolvedPots.reduce((a, b) => a + b, 0) / resolvedPots.length
            : 0;

        setStats({ tvl, savers, avgPot, loading: false });
      } catch {
        setStats((s) => ({ ...s, loading: false }));
      }
    })();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return stats;
}

export default function StatsPage() {
  const pot = usePotToday();
  const global = useGlobalStats();

  return (
    <motion.main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="text-center pt-4 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-celo-green/10 flex items-center justify-center mb-3">
          <Activity className="w-6 h-6 text-celo-green" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gradient">Global Stats</h1>
        <p className="mt-2 text-sm text-text-secondary">Network health and community metrics.</p>
      </motion.header>

      <motion.div variants={itemVariants} className="grid gap-4">
        {/* TVL Hero Card — real totalPrincipalOutstanding */}
        <StatCard
          title="Total Value Locked"
          icon={<Coins className="w-5 h-5" />}
          value={
            global.loading ? (
              <span className="flex items-center gap-2 text-2xl">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </span>
            ) : (
              <>
                $<CountUp to={global.tvl} decimals={2} duration={1500} />
              </>
            )
          }
          subtitle="cUSD locked across all active savers"
          delay={0.1}
        />

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Total Savers"
            icon={<Users className="w-4 h-4" />}
            value={
              global.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CountUp to={global.savers} duration={1200} />
              )
            }
            subtitle="unique addresses"
            delay={0.2}
          />
          <StatCard
            title="Avg Draw Pot"
            icon={<TrophyIcon className="w-4 h-4" />}
            value={
              global.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : global.avgPot === 0 ? (
                <span className="text-sm text-text-muted">—</span>
              ) : (
                <>
                  <CountUp to={global.avgPot} decimals={1} duration={1200} />
                  <span className="text-sm font-bold text-text-muted ml-1">cUSD</span>
                </>
              )
            }
            subtitle="last 7 draws"
            delay={0.3}
          />
        </div>

        {/* Today's live pot */}
        {!pot.loading && pot.jaraPot > 0n && (
          <StatCard
            title="Today's Pot"
            icon={<Coins className="w-4 h-4" />}
            value={
              <>
                <CountUp
                  to={Number(formatUnits(pot.jaraPot, 18))}
                  decimals={2}
                  duration={1000}
                />
                <span className="text-sm font-bold text-text-muted ml-1">cUSD</span>
              </>
            }
            subtitle={`${pot.totalTickets.toString()} tickets in pool`}
            delay={0.4}
          />
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <RecentWinnersFeed />
      </motion.div>

      <motion.section
        variants={itemVariants}
        className="glass-panel rounded-3xl p-5 border-l-4 border-l-celo-green"
      >
        <h3 className="text-sm font-bold text-text-primary mb-1">System Health: On-Chain</h3>
        <p className="text-xs text-text-secondary">
          All data is read live from Celo mainnet contracts. The keeper bot manages daily draws and yield harvesting. Smart contracts are fully collateralized.
        </p>
      </motion.section>

      <motion.footer
        variants={itemVariants}
        className="mt-auto pt-6 flex flex-col gap-4 text-center pb-safe"
      >
        <Link
          href="/"
          className="text-sm font-bold text-celo-green underline decoration-celo-green/30 decoration-dotted underline-offset-4 transition hover:text-[#2ebf73]"
        >
          ← Back to home
        </Link>
      </motion.footer>
    </motion.main>
  );
}

function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 6 7 6 7s6-1 6-7V2Z" />
    </svg>
  );
}
