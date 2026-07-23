import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits, parseAbiItem } from "viem";
import { celo } from "viem/chains";

// ── Supabase (optional) ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const SUPABASE_CONFIGURED =
  SUPABASE_URL.length > 0 &&
  !SUPABASE_URL.includes("placeholder") &&
  SUPABASE_KEY.length > 0 &&
  !SUPABASE_KEY.includes("placeholder");

// ── On-chain config ─────────────────────────────────────────────────────────
const POTVAULT = (process.env.NEXT_PUBLIC_POTVAULT_ADDRESS ??
  "0x0A9f549C0Fc859b0925c7dcB5F8A55d4020c1415") as `0x${string}`;
const STREAKSBT = (process.env.NEXT_PUBLIC_STREAKSBT_ADDRESS ??
  "0x9aC488Bc0Ba3cF7F2552c61d6F9BbA949961d974") as `0x${string}`;
const DRAWMANAGER = (process.env.NEXT_PUBLIC_DRAWMANAGER_ADDRESS ??
  "0xacB78C0DdAA33C660010dE76b842A54b613156B4") as `0x${string}`;
const CREWREGISTRY = (process.env.NEXT_PUBLIC_CREWREGISTRY_ADDRESS ??
  "0x73F0770aea05298579252dFf193df0454C0B5A8a") as `0x${string}`;

const rpc = createPublicClient({ chain: celo, transport: http() });

const contributedAbi = parseAbiItem(
  "event Contributed(address indexed user, uint256 indexed periodId, uint256 amount, uint256 ticketsMinted)",
);

// Minimal ABIs for server-side reads
const streakAbi = [
  { type: "function", name: "streakOf", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "currentDay", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

const potAbi = [
  { type: "function", name: "currentPeriod", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "principalOf", inputs: [{ name: "user", type: "address" }, { name: "periodId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

const drawAbi = [
  { type: "function", name: "pickOf", inputs: [{ name: "user", type: "address" }, { name: "periodId", type: "uint256" }], outputs: [{ name: "number", type: "uint8" }, { name: "weight", type: "uint256" }], stateMutability: "view" },
] as const;

const crewAbi = [
  { type: "function", name: "crewOf", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "memberCount", inputs: [{ name: "crewId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

/**
 * Derive quest progress from Celo mainnet contract state.
 * This is the guaranteed-available fallback when Supabase is not configured.
 */
async function deriveQuestsFromChain(address: `0x${string}`) {
  const [periodId, streakDays, currentDay] = await Promise.all([
    rpc.readContract({ address: POTVAULT, abi: potAbi, functionName: "currentPeriod" }),
    rpc.readContract({ address: STREAKSBT, abi: streakAbi, functionName: "streakOf", args: [address] }),
    rpc.readContract({ address: STREAKSBT, abi: streakAbi, functionName: "currentDay" }),
  ]);

  const [todayPrincipal, currentPick, crewId] = await Promise.all([
    rpc.readContract({ address: POTVAULT, abi: potAbi, functionName: "principalOf", args: [address, periodId] }),
    rpc.readContract({ address: DRAWMANAGER, abi: drawAbi, functionName: "pickOf", args: [address, periodId] }),
    rpc.readContract({ address: CREWREGISTRY, abi: crewAbi, functionName: "crewOf", args: [address] }).catch(() => 0n),
  ]);

  // Scan recent blocks for save count (up to 14 periods back)
  const latest = await rpc.getBlockNumber();
  const fromBlock = latest > 50_000n ? latest - 50_000n : 0n;
  const chunk = 4_000n;
  const uniquePeriodsSet = new Set<string>();
  
  for (let start = fromBlock; start <= latest; start += chunk) {
    const end = start + chunk - 1n < latest ? start + chunk - 1n : latest;
    const logs = await rpc.getLogs({
      address: POTVAULT,
      event: contributedAbi,
      args: { user: address },
      fromBlock: start,
      toBlock: end,
    });
    for (const l of logs) {
      if (l.args.periodId) {
        uniquePeriodsSet.add(l.args.periodId.toString());
      }
    }
  }
  const uniquePeriods = uniquePeriodsSet.size;

  // Check-in: if streakOf returns same-day value (simplistic: streak > 0 and last check was today's day index)
  const savedToday = todayPrincipal > 0n;
  const hasPick    = currentPick[0] !== 0;
  const streak     = Number(streakDays);

  let crewMembers = 0;
  if (crewId !== 0n) {
    crewMembers = Number(
      await rpc.readContract({ address: CREWREGISTRY, abi: crewAbi, functionName: "memberCount", args: [crewId] }).catch(() => 0n),
    );
  }

  return [
    {
      id: "daily_save",
      title: "Daily Saver",
      description: "Save at least 1 cUSD into the vault today.",
      xpReward: 50,
      progress: savedToday ? 1 : 0,
      total: 1,
      completed: savedToday,
      type: "daily",
    },
    {
      id: "daily_pick",
      title: "Pick Your Number",
      description: "Pick a lucky number for today's draw.",
      xpReward: 25,
      progress: hasPick ? 1 : 0,
      total: 1,
      completed: hasPick,
      type: "daily",
    },
    {
      id: "weekly_streak_3",
      title: "Consistent Builder",
      description: "Maintain a 3-day savings streak.",
      xpReward: 500,
      progress: Math.min(streak, 3),
      total: 3,
      completed: streak >= 3,
      type: "weekly",
    },
    {
      id: "weekly_streak_7",
      title: "Week Warrior",
      description: "Maintain a 7-day streak.",
      xpReward: 1000,
      progress: Math.min(streak, 7),
      total: 7,
      completed: streak >= 7,
      type: "weekly",
    },
    {
      id: "weekly_saves_5",
      title: "Five-Time Saver",
      description: "Save across 5 different days.",
      xpReward: 250,
      progress: Math.min(uniquePeriods, 5),
      total: 5,
      completed: uniquePeriods >= 5,
      type: "weekly",
    },
    {
      id: "onetime_crew",
      title: "Crew Expansion",
      description: "Join or create a crew with at least 1 other member.",
      xpReward: 250,
      progress: Math.min(crewMembers, 1),
      total: 1,
      completed: crewMembers >= 1,
      type: "one-time",
    },
  ];
}

// ── Supabase path ──────────────────────────────────────────────────────────────
async function fetchFromSupabase(address: string) {
  const { getServiceSupabase } = await import("../../../lib/supabase");
  const supabase = getServiceSupabase();

  const { data: questRows, error: qErr } = await supabase.from("quests").select("*");
  if (qErr) throw qErr;

  const { data: userProgress, error: pErr } = await supabase
    .from("user_quests")
    .select("*")
    .eq("user_address", address.toLowerCase());
  if (pErr) throw pErr;

  return questRows.map((q: { id: string, name: string, description: string, type: string, target: number, reward_xp: number }) => {
    const up = userProgress.find((u: { quest_id: string, progress: number, claimed: boolean }) => u.quest_id === q.id);
    return {
      id: q.id,
      title: q.title,
      description: q.description,
      xpReward: q.xp_reward,
      progress: up?.progress ?? 0,
      total: q.target_count,
      completed: up?.completed ?? false,
      type: q.quest_type,
    };
  });
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("address");
  if (!raw) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const address = raw.toLowerCase() as `0x${string}`;

  // Try Supabase first; fall back to on-chain derivation.
  if (SUPABASE_CONFIGURED) {
    try {
      const data = await fetchFromSupabase(address);
      return NextResponse.json(data);
    } catch (err) {
      console.error("[quests] Supabase failed, falling back to chain:", err);
    }
  }

  // On-chain derivation — always works against Celo mainnet.
  try {
    const data = await deriveQuestsFromChain(address as `0x${string}`);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("[quests] Chain derivation failed:", err);
    return NextResponse.json({ error: "Failed to load quests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json(
      { error: "Quest claiming requires Supabase — configure SUPABASE_SERVICE_ROLE_KEY." },
      { status: 501 },
    );
  }

  try {
    const { address, questId } = await request.json();
    if (!address || !questId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { getServiceSupabase } = await import("../../../lib/supabase");
    const supabase = getServiceSupabase();

    const { data: uq, error: fetchError } = await supabase
      .from("user_quests")
      .select("*, quests(target_count, xp_reward)")
      .eq("user_address", address.toLowerCase())
      .eq("quest_id", questId)
      .single();

    if (fetchError || !uq) {
      return NextResponse.json({ error: "Quest progress not found" }, { status: 404 });
    }

    if (uq.progress >= uq.quests.target_count && !uq.completed) {
      await supabase
        .from("user_quests")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", uq.id);

      await supabase.rpc("increment_xp", {
        user_addr: address.toLowerCase(),
        amount: uq.quests.xp_reward,
      });

      return NextResponse.json({ success: true, awarded: uq.quests.xp_reward });
    }

    return NextResponse.json({ error: "Quest not ready to claim" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[quests POST]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
