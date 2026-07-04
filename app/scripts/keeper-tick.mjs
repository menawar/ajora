#!/usr/bin/env node
/**
 * Ajora draw keeper — stateless tick. Run on any schedule (GitHub Actions cron);
 * each run reads chain state and does exactly what's needed, or nothing:
 *
 *   yesterday unresolved, no commit            -> recommitSeed   (bootstrap)
 *   yesterday unresolved, anchor mined+fresh   -> revealAndResolve
 *   yesterday unresolved, anchor expired       -> recommitSeed   (fresh cycle)
 *   inside today's final commit window         -> commitSeed
 *
 * The secret is derived deterministically as keccak256(privkey ‖ periodId), so no
 * state survives between runs and any tick can reveal any period it committed.
 *
 * Env: KEEPER_PRIVATE_KEY (required unless DRY_RUN=1), RPC_URL (default forno),
 *      DRY_RUN=1 to print the decision without sending.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  concatHex,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
  keccak256,
  numberToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

const here = dirname(fileURLToPath(import.meta.url));
const deployments = JSON.parse(
  readFileSync(join(here, "..", "..", "contracts", "deployments", "celo-mainnet.json"), "utf8"),
);

const RPC_URL = process.env.RPC_URL ?? "https://forno.celo.org";
const DRY_RUN = process.env.DRY_RUN === "1";

const vaultAbi = [
  { type: "function", name: "currentPeriod", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
];
const drawAbi = [
  { type: "function", name: "COMMIT_WINDOW", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "ANCHOR_DELAY", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "seedCommits", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "bytes32" }, { type: "uint64" }] },
  { type: "function", name: "drawOf", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "resolved", type: "bool" }, { name: "winningNumber", type: "uint8" }, { name: "seed", type: "uint256" }, { name: "pot", type: "uint256" }, { name: "totalWinningWeight", type: "uint256" }] }] },
  { type: "function", name: "commitSeed", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "bytes32" }], outputs: [] },
  { type: "function", name: "revealAndResolve", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "bytes32" }], outputs: [] },
  { type: "function", name: "recommitSeed", stateMutability: "nonpayable", inputs: [{ type: "uint256" }, { type: "bytes32" }], outputs: [] },
];

const vault = { address: deployments.contracts.PotVault.address, abi: vaultAbi };
const draw = { address: deployments.contracts.DrawManager.address, abi: drawAbi };

const pub = createPublicClient({ chain: celo, transport: http(RPC_URL) });

const pk = process.env.KEEPER_PRIVATE_KEY
  ? process.env.KEEPER_PRIVATE_KEY.startsWith("0x")
    ? process.env.KEEPER_PRIVATE_KEY
    : `0x${process.env.KEEPER_PRIVATE_KEY}`
  : undefined;
if (!pk && !DRY_RUN) {
  console.error("KEEPER_PRIVATE_KEY required (or DRY_RUN=1)");
  process.exit(1);
}
const account = pk ? privateKeyToAccount(pk) : undefined;
const wallet = account
  ? createWalletClient({ account, chain: celo, transport: http(RPC_URL) })
  : undefined;

/** Deterministic per-period secret only the keeper can derive. */
const secretFor = (periodId) => keccak256(concatHex([pk ?? "0x00", numberToHex(periodId, { size: 32 })]));
const commitmentFor = (periodId) =>
  keccak256(encodeAbiParameters([{ type: "bytes32" }], [secretFor(periodId)]));

async function send(functionName, args, label) {
  if (DRY_RUN) {
    console.log(`DRY_RUN: would ${label}: ${functionName}(${args.join(", ")})`);
    return;
  }
  const { request } = await pub.simulateContract({ ...draw, functionName, args, account });
  const hash = await wallet.writeContract(request);
  await pub.waitForTransactionReceipt({ hash });
  console.log(`${label}: ${hash}`);
}

const period = await pub.readContract({ ...vault, functionName: "currentPeriod" });
const last = period - 1n;
const block = await pub.getBlockNumber();
const now = BigInt(Math.floor(Date.now() / 1000));

// ---- yesterday: drive it to resolution ----
const lastDraw = await pub.readContract({ ...draw, functionName: "drawOf", args: [last] });
if (!lastDraw.resolved) {
  const [commitment, anchorBlock] = await pub.readContract({
    ...draw,
    functionName: "seedCommits",
    args: [last],
  });
  const anchor = BigInt(anchorBlock);
  if (commitment === "0x" + "0".repeat(64)) {
    await send("recommitSeed", [last, commitmentFor(last)], `bootstrap commit for period ${last}`);
  } else if (commitment !== commitmentFor(last) && !DRY_RUN) {
    console.error(`period ${last}: on-chain commitment is not ours — rotated key? manual action needed`);
    process.exitCode = 2;
  } else if (block <= anchor) {
    console.log(`period ${last}: waiting for anchor ${anchor} (now ${block})`);
  } else if (block <= anchor + 256n) {
    await send("revealAndResolve", [last, secretFor(last)], `reveal period ${last}`);
  } else {
    await send("recommitSeed", [last, commitmentFor(last)], `recommit period ${last} (window expired)`);
  }
} else {
  console.log(`period ${last}: resolved (number ${lastDraw.winningNumber})`);
}

// ---- today: commit inside the final window ----
const commitWindow = await pub.readContract({ ...draw, functionName: "COMMIT_WINDOW" });
const periodEnd = (period + 1n) * 86_400n;
if (periodEnd - now <= commitWindow) {
  const [commitment] = await pub.readContract({ ...draw, functionName: "seedCommits", args: [period] });
  if (commitment === "0x" + "0".repeat(64)) {
    await send("commitSeed", [period, commitmentFor(period)], `commit for period ${period}`);
  } else {
    console.log(`period ${period}: already committed`);
  }
} else {
  console.log(`period ${period}: not in commit window (${periodEnd - now}s to close)`);
}

console.log("tick complete");
