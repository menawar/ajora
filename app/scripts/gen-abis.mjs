#!/usr/bin/env node
/**
 * Extract contract ABIs from Foundry artifacts into typed viem modules.
 * Run `forge build` in contracts/ first, then `npm run gen:abis` here.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "..", "contracts", "out");
const dest = join(root, "lib", "abi");
mkdirSync(dest, { recursive: true });

const contracts = ["PotVault", "StreakSBT", "SprayFaucet", "DrawManager"];

for (const name of contracts) {
  const artifact = JSON.parse(readFileSync(join(out, `${name}.sol`, `${name}.json`), "utf8"));
  const varName = name[0].toLowerCase() + name.slice(1) + "Abi";
  const body =
    `// Auto-generated from contracts/out/${name}.sol/${name}.json — do not edit.\n` +
    `// Regenerate with: npm run gen:abis\n` +
    `export const ${varName} = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`;
  writeFileSync(join(dest, `${varName}.ts`), body);
  console.log(`wrote lib/abi/${varName}.ts (${artifact.abi.length} entries)`);
}
