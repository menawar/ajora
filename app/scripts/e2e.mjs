#!/usr/bin/env node
/**
 * E2E happy path over the app's exact user flow, against a local anvil chain:
 * deploy core -> verify user -> approve -> contribute -> checkIn -> pickNumber,
 * then assert every read the UI depends on. Requires `forge build` artifacts
 * and the `anvil` binary (Foundry).
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "contracts", "out");
const artifact = (name) =>
  JSON.parse(readFileSync(join(out, `${name}.sol`, `${name}.json`), "utf8"));

// anvil's stock dev accounts
const deployer = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const user = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
);

const PORT = 8547;
const rpc = `http://127.0.0.1:${PORT}`;

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
  throw new Error(msg);
}
function ok(msg) {
  console.log(`✓ ${msg}`);
}

const anvil = spawn("anvil", ["--port", String(PORT), "--silent"], { stdio: "ignore" });
try {
  // Wait for RPC to come up.
  const publicClient = createPublicClient({ chain: foundry, transport: http(rpc) });
  for (let i = 0; ; i++) {
    try {
      await publicClient.getChainId();
      break;
    } catch {
      if (i > 50) fail("anvil did not start");
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  const wallet = (account) => createWalletClient({ account, chain: foundry, transport: http(rpc) });
  const deploy = async (name, args = []) => {
    const a = artifact(name);
    const hash = await wallet(deployer).deployContract({
      abi: a.abi,
      bytecode: a.bytecode.object,
      args,
    });
    const rcpt = await publicClient.waitForTransactionReceipt({ hash });
    return { address: rcpt.contractAddress, abi: a.abi };
  };
  const write = async (account, contract, functionName, args) => {
    const hash = await wallet(account).writeContract({ ...contract, functionName, args });
    return publicClient.waitForTransactionReceipt({ hash });
  };
  const read = (contract, functionName, args = []) =>
    publicClient.readContract({ ...contract, functionName, args });

  // ---- deploy + wire the core exactly like Deploy.s.sol ----
  const MIN = parseUnits("0.1", 18);
  const cusd = await deploy("MockERC20", ["Celo Dollar", "cUSD", 18]);
  const vault = await deploy("PotVault", [cusd.address, MIN]);
  const streak = await deploy("StreakSBT", []);
  const faucet = await deploy("SprayFaucet", [vault.address, deployer.address]);
  const draw = await deploy("DrawManager", [vault.address, deployer.address]);
  await write(deployer, vault, "setStreakSBT", [streak.address]);
  await write(deployer, vault, "setSprayFaucet", [faucet.address]);
  await write(deployer, vault, "setDrawManager", [draw.address]);
  ok("core deployed and wired");

  // ---- the app's happy path, as the user ----
  await write(deployer, cusd, "mint", [user.address, parseUnits("10", 18)]);
  await write(user, cusd, "approve", [vault.address, parseUnits("1", 18)]);
  await write(user, streak, "checkIn", []);
  await write(user, vault, "contribute", [parseUnits("1", 18)]);
  await write(user, draw, "pickNumber", [7]);
  ok("approve -> checkIn -> contribute -> pickNumber all confirmed");

  // ---- every read the UI renders ----
  const period = await read(vault, "currentPeriod");
  const tickets = await read(vault, "ticketsOf", [user.address, period]);
  if (tickets !== 10n) fail(`expected 10 tickets, got ${tickets}`);
  const principal = await read(vault, "principalOf", [user.address, period]);
  if (principal !== parseUnits("1", 18)) fail(`principal mismatch: ${principal}`);
  const streakDays = await read(streak, "streakOf", [user.address]);
  if (streakDays !== 1n) fail(`expected 1-day streak, got ${streakDays}`);
  const [number, weight] = await read(draw, "pickOf", [user.address, period]);
  if (number !== 7 || weight !== 10n) fail(`pick mismatch: ${number}/${weight}`);
  const info = await read(vault, "periodInfo", [period]);
  if (info.totalTickets !== 10n) fail("periodInfo.totalTickets mismatch");
  ok("all UI reads consistent (tickets, principal, streak, pick, periodInfo)");

  console.log("\nE2E happy path PASSED");
} finally {
  anvil.kill();
}
