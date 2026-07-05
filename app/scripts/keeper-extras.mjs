#!/usr/bin/env node
/**
 * Wave-2 keeper jobs (#53 harvest, #54 sweep, #55 vest, #56 watchdog).
 *
 * All jobs are idempotent and env-gated: anything whose contract address is not
 * configured (pre-v5) is a clean skip, so the cron can run today and start doing
 * real work the moment the deploy lands. DRY_RUN=1 simulates without sending.
 *
 * Usage: node scripts/keeper-extras.mjs harvest|sweep|vest|watchdog
 */
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const deployments = JSON.parse(
  readFileSync(join(here, "../../contracts/deployments/celo-mainnet.json"), "utf8"),
);

const RPC_URL = process.env.RPC_URL ?? "https://forno.celo.org";
const DRY_RUN = process.env.DRY_RUN === "1";

// Post-v5 addresses come from env until deployments.json carries them.
const YIELD_ADAPTER = process.env.YIELD_ADAPTER;
const TREASURY = process.env.TREASURY;
const CREW_REGISTRY = process.env.CREW_REGISTRY;
const INDEXER_URL = process.env.INDEXER_URL;

const VAULT = deployments.contracts.PotVault.address;
const DRAW = deployments.contracts.DrawManager.address;

const pub = createPublicClient({ chain: celo, transport: http(RPC_URL) });

const pk = process.env.KEEPER_PRIVATE_KEY
  ? process.env.KEEPER_PRIVATE_KEY.startsWith("0x")
    ? process.env.KEEPER_PRIVATE_KEY
    : `0x${process.env.KEEPER_PRIVATE_KEY}`
  : undefined;
const account = pk ? privateKeyToAccount(pk) : undefined;
const wallet = account
  ? createWalletClient({ chain: celo, transport: http(RPC_URL), account })
  : undefined;

const vaultAbi = [
  { type: "function", name: "currentPeriod", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "periodInfo", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "id", type: "uint256" }, { name: "totalPrincipal", type: "uint256" }, { name: "jaraPot", type: "uint256" }, { name: "totalTickets", type: "uint256" }, { name: "resolved", type: "bool" }, { name: "vrfSeed", type: "uint256" }] }] },
];
const adapterAbi = [
  { type: "function", name: "harvest", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
];
const treasuryAbi = [
  { type: "function", name: "sweepUnclaimed", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
];
const crewAbi = [
  { type: "function", name: "referrerOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "address" }] },
  { type: "function", name: "referralVested", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "savedDayCount", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "vestReferral", stateMutability: "nonpayable", inputs: [{ type: "address" }], outputs: [] },
];
const drawAbi = [
  { type: "function", name: "drawOf", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "resolved", type: "bool" }, { name: "winningNumber", type: "uint8" }, { name: "resolvedAt", type: "uint64" }, { name: "seed", type: "uint256" }, { name: "pot", type: "uint256" }, { name: "totalWinningWeight", type: "uint256" }] }] },
];

/** Simulate first; a revert means "nothing to do" for these idempotent calls. */
async function sendIfUseful(contract, functionName, args, label) {
  let request;
  try {
    ({ request } = await pub.simulateContract({ ...contract, functionName, args, account }));
  } catch (err) {
    console.log(`skip ${label}: ${err.shortMessage ?? err.message}`);
    return false;
  }
  if (DRY_RUN || !wallet) {
    console.log(`DRY_RUN: would ${label}`);
    return true;
  }
  const hash = await wallet.writeContract(request);
  console.log(`${label}: ${hash}`);
  return true;
}

const currentPeriod = () => pub.readContract({ address: VAULT, abi: vaultAbi, functionName: "currentPeriod" });

// ---- #53: hourly — venue interest into tonight's pot ----
async function harvest() {
  if (!YIELD_ADAPTER) return console.log("harvest: YIELD_ADAPTER unset (pre-v5), skipping");
  const period = await currentPeriod();
  await sendIfUseful(
    { address: YIELD_ADAPTER, abi: adapterAbi },
    "harvest",
    [period],
    `harvest(${period})`,
  );
}

// ---- #54: daily — recycle pots whose 7-day claim window closed ----
async function sweep() {
  if (!TREASURY) return console.log("sweep: TREASURY unset (pre-v5), skipping");
  const period = await currentPeriod();
  // Periods old enough that a window could have closed; simulation filters the rest.
  for (let back = 8n; back <= 15n; back++) {
    await sendIfUseful(
      { address: TREASURY, abi: treasuryAbi },
      "sweepUnclaimed",
      [period - back],
      `sweepUnclaimed(${period - back})`,
    );
  }
}

// ---- #55: daily — vest referrals once invitees hit 3 self-funded save days ----
async function vest() {
  if (!CREW_REGISTRY) return console.log("vest: CREW_REGISTRY unset (pre-v5), skipping");
  if (!INDEXER_URL) return console.log("vest: INDEXER_URL unset, skipping");

  // Indexer supplies candidates (anyone who saved); the contract is the referee.
  const res = await fetch(`${INDEXER_URL}/leaderboard/alltime?by=saved&limit=100&includeFlagged=true`);
  if (!res.ok) throw new Error(`indexer ${res.status}`);
  const { rows } = await res.json();

  const crew = { address: CREW_REGISTRY, abi: crewAbi };
  for (const { address } of rows) {
    const [referrer, vested, days] = await Promise.all([
      pub.readContract({ ...crew, functionName: "referrerOf", args: [address] }),
      pub.readContract({ ...crew, functionName: "referralVested", args: [address] }),
      pub.readContract({ ...crew, functionName: "savedDayCount", args: [address] }),
    ]);
    if (referrer === "0x0000000000000000000000000000000000000000" || vested || days < 3n) continue;
    await sendIfUseful(crew, "vestReferral", [address], `vestReferral(${address})`);
  }
}

// ---- #56: daily — dead-man's switch: yesterday had players but no resolution ----
async function watchdog() {
  const period = await currentPeriod();
  const yesterday = period - 1n;
  const info = await pub.readContract({
    address: VAULT,
    abi: vaultAbi,
    functionName: "periodInfo",
    args: [yesterday],
  });
  if (info.totalTickets === 0n && info.jaraPot === 0n) {
    return console.log(`watchdog: period ${yesterday} had no players, nothing to resolve`);
  }
  let resolved = false;
  try {
    const draw = await pub.readContract({
      address: DRAW,
      abi: drawAbi,
      functionName: "drawOf",
      args: [yesterday],
    });
    resolved = draw.resolved;
  } catch {
    // v3 Draw struct lacks resolvedAt; a decode failure still means "check by hand"
  }
  if (!resolved) {
    console.error(`MISSED_DRAW: period ${yesterday} has players but no resolution`);
    process.exit(1); // the workflow turns a non-zero exit into an alert issue
  }
  console.log(`watchdog: period ${yesterday} resolved`);
}

const cmd = process.argv[2];
const jobs = { harvest, sweep, vest, watchdog };
if (!jobs[cmd]) {
  console.error("usage: node scripts/keeper-extras.mjs harvest|sweep|vest|watchdog");
  process.exit(2);
}
await jobs[cmd]();
