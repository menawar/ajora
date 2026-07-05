#!/usr/bin/env node
/**
 * Nightly Proof-of-Ship metrics rollup — zero infra: scans one period's logs from
 * the public RPC and merges the aggregate into metrics/daily.json + summary.json,
 * which a GitHub Action commits (and the /stats page renders at build time).
 *
 * Usage: node scripts/collect-metrics.mjs [periodId]   (default: yesterday)
 * The proper indexer (#14, Ponder) supersedes this; the JSON shape is kept simple
 * so the migration is a data-source swap.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, http, parseAbi } from "viem";
import { celo } from "viem/chains";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const deployments = JSON.parse(
  readFileSync(join(root, "contracts", "deployments", "celo-mainnet.json"), "utf8"),
);
const metricsDir = join(root, "metrics");
mkdirSync(metricsDir, { recursive: true });

const pub = createPublicClient({
  chain: celo,
  transport: http(process.env.RPC_URL ?? "https://forno.celo.org"),
});

// Every game event that carries the periodId (exact attribution) + the two that don't
// (CheckedIn, Verified — attributed by block window, marked approximate).
const events = parseAbi([
  "event Contributed(address indexed user, uint256 indexed periodId, uint256 amount, uint256 ticketsMinted)",
  "event TicketsCredited(address indexed user, uint256 indexed periodId, uint256 tickets)",
  "event NumberPicked(address indexed user, uint256 indexed periodId, uint8 number, uint256 weight)",
  "event Sprayed(address indexed from, address indexed to, uint256 indexed periodId, uint256 value)",
  "event WelcomeTicket(address indexed user, uint256 indexed periodId, uint256 value)",
  "event PrincipalClaimed(address indexed user, uint256 indexed periodId, uint256 amount)",
  "event WinningsClaimed(address indexed user, uint256 indexed periodId, uint256 amount)",
  "event PrizeClaimed(address indexed user, uint256 indexed periodId, uint256 amount)",
  "event DrawResolved(uint256 indexed periodId, uint256 seed, uint8 winningNumber, uint256 pot, uint256 totalWinningWeight)",
  "event CheckedIn(address indexed user, uint256 streakDays, uint256 multiplierX10)",
  "event Verified(address indexed user, bool verified)",
]);

const addresses = [
  deployments.contracts.PotVault.address,
  deployments.contracts.StreakSBT.address,
  deployments.contracts.SprayFaucet.address,
  deployments.contracts.DrawManager.address,
];

const periodId = BigInt(process.argv[2] ?? Math.floor(Date.now() / 1000 / 86400) - 1);
const startTs = periodId * 86_400n;
const endTs = startTs + 86_400n;

const latest = await pub.getBlock();
if (latest.timestamp < endTs) {
  console.error(`period ${periodId} has not ended yet`);
  process.exit(1);
}
// ~1s Celo blocks; generous margins, then exact periodId topics do the real filtering.
const back = (ts) => (latest.timestamp > ts ? latest.number - (latest.timestamp - ts) : 0n);
const fromBlock = back(startTs) > 900n ? back(startTs) - 900n : 0n;
const toBlock = back(endTs) + 900n > latest.number ? latest.number : back(endTs) + 900n;

const CHUNK = 5_000n;
const logs = [];
for (let from = fromBlock; from <= toBlock; from += CHUNK) {
  const to = from + CHUNK - 1n < toBlock ? from + CHUNK - 1n : toBlock;
  logs.push(...(await pub.getLogs({ address: addresses, events, fromBlock: from, toBlock: to })));
}

const inPeriod = (l) => l.args.periodId === undefined || l.args.periodId === periodId;
const day = logs.filter(inPeriod);

const users = new Set();
const txs = new Set();
let principalIn = 0n;
let prizesPaid = 0n;
let sprays = 0;
let welcomes = 0;
let picks = 0;
let checkIns = 0;
let contributions = 0;
let resolved = null;
const verifiedNow = new Set();

for (const l of day) {
  txs.add(l.transactionHash);
  for (const k of ["user", "from", "to"]) if (l.args[k]) users.add(l.args[k].toLowerCase());
  switch (l.eventName) {
    case "Contributed":
      contributions += 1;
      principalIn += l.args.amount;
      break;
    case "PrizeClaimed":
      prizesPaid += l.args.amount;
      break;
    case "Sprayed":
      sprays += 1;
      break;
    case "WelcomeTicket":
      welcomes += 1;
      break;
    case "NumberPicked":
      picks += 1;
      break;
    case "CheckedIn":
      checkIns += 1;
      break;
    case "DrawResolved":
      resolved = { winningNumber: l.args.winningNumber, pot: l.args.pot.toString() };
      break;
    case "Verified":
      if (l.args.verified) verifiedNow.add(l.args.user.toLowerCase());
      break;
  }
}

// ---- merge into the rollup files ----
const dailyPath = join(metricsDir, "daily.json");
const summaryPath = join(metricsDir, "summary.json");
const daily = existsSync(dailyPath) ? JSON.parse(readFileSync(dailyPath, "utf8")) : [];
const summary = existsSync(summaryPath)
  ? JSON.parse(readFileSync(summaryPath, "utf8"))
  : { firstSeen: {}, verified: [], totalTx: 0, totalPrincipalIn: "0", totalPrizesPaid: "0" };

let newUsers = 0;
for (const u of users) {
  if (!summary.firstSeen[u]) {
    summary.firstSeen[u] = Number(periodId);
    newUsers += 1;
  }
}
for (const v of verifiedNow) if (!summary.verified.includes(v)) summary.verified.push(v);

// Push delivery snapshot (#70): optional — the rollup works without a push service.
let push = null;
if (process.env.PUSH_URL) {
  try {
    const res = await fetch(`${process.env.PUSH_URL}/metrics`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const m = await res.json();
      push = { subscribers: m.subscribers, sends: m.sends };
    }
  } catch (err) {
    console.warn(`push metrics unavailable: ${err.message}`);
  }
}

const row = {
  periodId: Number(periodId),
  date: new Date(Number(startTs) * 1000).toISOString().slice(0, 10),
  txCount: txs.size,
  activeUsers: users.size,
  newUsers,
  contributions,
  principalIn: principalIn.toString(),
  prizesPaid: prizesPaid.toString(),
  sprays,
  welcomes,
  picks,
  checkIns,
  resolved,
  push, // { subscribers, sends: [{kind, ok, failed}] } or null when no PUSH_URL
  note: "periodId-topic exact; CheckedIn/Verified block-window approximate",
};

const idx = daily.findIndex((d) => d.periodId === row.periodId);
const prev = idx >= 0 ? daily[idx] : null;
if (idx >= 0) daily[idx] = row;
else daily.push(row);
daily.sort((a, b) => a.periodId - b.periodId);

summary.totalTx += row.txCount - (prev?.txCount ?? 0);
summary.totalPrincipalIn = (
  BigInt(summary.totalPrincipalIn) + principalIn - BigInt(prev?.principalIn ?? 0)
).toString();
summary.totalPrizesPaid = (
  BigInt(summary.totalPrizesPaid) + prizesPaid - BigInt(prev?.prizesPaid ?? 0)
).toString();
summary.totalUsers = Object.keys(summary.firstSeen).length;
summary.verifiedUsers = summary.verified.length;
summary.updatedAt = new Date().toISOString();

writeFileSync(dailyPath, JSON.stringify(daily, null, 2) + "\n");
writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");
console.log(
  `period ${periodId} (${row.date}): ${row.txCount} txs, ${row.activeUsers} active, ${newUsers} new`,
);
