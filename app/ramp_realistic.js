const { createWalletClient, createPublicClient, http, parseAbi, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { celo } = require('viem/chains'); // Celo Mainnet — contracts deployed here

// --- Addresses (from app/lib/contracts.ts — Celo MAINNET, core_v5, deployed 2026-07-07) ---
const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"; // Celo Mainnet cUSD
const POTVAULT_ADDRESS = "0x0A9f549C0Fc859b0925c7dcB5F8A55d4020c1415";
const DRAWMANAGER_ADDRESS = "0xacB78C0DdAA33C660010dE76b842A54b613156B4";
const STREAKSBT_ADDRESS = "0x9aC488Bc0Ba3cF7F2552c61d6F9BbA949961d974";
const SPRAYFAUCET_ADDRESS = "0x117cEa08fD62220506FD7621C548a627373B2DFc";

// Use a reliable public Celo RPC
const RPC_URL = process.env.CELO_RPC_URL || 'https://forno.celo.org';

// --- ABIs ---
const ABIs = parseAbi([
  // ERC20
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  // PotVault
  'function minContribution() view returns (uint256)',
  'function contribute(uint256 amount)',
  'function currentPeriod() view returns (uint256)',
  'function claimPrincipal(uint256 periodId)',
  'function principalOf(address user, uint256 periodId) view returns (uint256)',
  // DrawManager
  'function pickNumber(uint8 number)',
  // StreakSBT
  'function checkIn()',
  // SprayFaucet
  'function spray(address friend)'
]);

require('dotenv').config();

function getPrivateKeys() {
  const keys = [];
  for (const [envKey, value] of Object.entries(process.env)) {
    if (!value || typeof value !== 'string') continue;
    // Remove quotes and 0x prefix
    const stripped = value.trim().replace(/['"]/g, '').replace(/^0x/i, '');
    // Valid private key: exactly 64 hex characters
    if (/^[0-9a-fA-F]{64}$/.test(stripped)) {
      keys.push(`0x${stripped}`);
    }
  }
  return keys;
}

// Generate a random Celo address for spraying
function getRandomAddress() {
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += Math.floor(Math.random() * 16).toString(16);
  }
  return address;
}

async function runRealisticRamp(loopsPerWallet = 5) {
  const privateKeys = getPrivateKeys();
  if (privateKeys.length === 0) {
    console.error("❌ No private keys found. Please set PRIVATE_KEY_1=0x... in your .env");
    return;
  }

  const publicClient = createPublicClient({ chain: celo, transport: http(RPC_URL) });

  // ── Read minContribution from the contract once (shared for all wallets) ──
  let minContribution = parseEther('0.1'); // safe fallback
  try {
    minContribution = await publicClient.readContract({
      address: POTVAULT_ADDRESS, abi: ABIs, functionName: 'minContribution'
    });
    console.log(`📋 Vault minimum contribution: ${formatEther(minContribution)} cUSD`);
  } catch(e) {
    console.log(`⚠️  Could not read minContribution, defaulting to 0.1 cUSD`);
  }

  console.log(`Found ${privateKeys.length} wallets. Starting enhanced realistic transactions...\n`);

  for (let i = 0; i < privateKeys.length; i++) {
    const account = privateKeyToAccount(privateKeys[i]);
    const client = createWalletClient({ account, chain: celo, transport: http(RPC_URL) });

    console.log(`🚀 Wallet ${i + 1} (${account.address}):`);

    // Read current cUSD balance
    let balance = 0n;
    try {
      balance = await publicClient.readContract({
        address: CUSD_ADDRESS, abi: ABIs, functionName: 'balanceOf', args: [account.address]
      });
      console.log(`  💰 cUSD Balance: ${formatEther(balance)} cUSD`);
    } catch(e) {
      console.error(`  ⚠️  Could not read cUSD balance`);
    }

    let canSave = balance >= minContribution;
    if (!canSave) {
      console.log(`  ℹ️  Balance (${formatEther(balance)}) < minimum (${formatEther(minContribution)}) — will skip Save/Approve initially (unless withdraw succeeds).`);
    }

    for (let loop = 0; loop < loopsPerWallet; loop++) {
      console.log(`\n  ─── Loop ${loop + 1}/${loopsPerWallet} ───`);

      // ── [1] Withdraw FIRST — scan past periods (since currentPeriod is locked) ──
      try {
        const currentPeriod = await publicClient.readContract({
          address: POTVAULT_ADDRESS, abi: ABIs, functionName: 'currentPeriod'
        });
        
        let foundPrincipal = false;
        // Scan up to 10 previous periods
        for (let p = currentPeriod - 1n; p >= currentPeriod - 10n && p >= 0n; p--) {
          const principal = await publicClient.readContract({
            address: POTVAULT_ADDRESS, abi: ABIs, functionName: 'principalOf',
            args: [account.address, p]
          });

          if (principal > 0n) {
            foundPrincipal = true;
            console.log(`  [1] Withdrawing ${formatEther(principal)} cUSD from PAST period ${p}...`);
            const tx = await client.writeContract({
              address: POTVAULT_ADDRESS, abi: ABIs, functionName: 'claimPrincipal',
              args: [p],
            });
            await publicClient.waitForTransactionReceipt({ hash: tx });
            console.log(`    ✅ Withdrawn: ${tx}`);
            
            // Update balance dynamically so we can save it immediately in step 2
            balance += principal;
            canSave = balance >= minContribution;
            break; // Only claim one period per loop to spread txs
          }
        }
        
        if (!foundPrincipal) {
          console.log(`  [1] No principal available in past periods — skipping.`);
        }
      } catch(e) { console.error(`    ⚠️  Withdraw failed: ${e.shortMessage || e.message}`); }

      // ── [2] Approve + Save — only if wallet has >= minContribution ────────────
      if (canSave) {
        try {
          console.log(`  [2] Approving ${formatEther(minContribution)} cUSD...`);
          const tx = await client.writeContract({
            address: CUSD_ADDRESS, abi: ABIs, functionName: 'approve',
            args: [POTVAULT_ADDRESS, minContribution],
          });
          await publicClient.waitForTransactionReceipt({ hash: tx });
          console.log(`    ✅ Approved: ${tx}`);
        } catch(e) { console.error(`    ❌ Approve failed: ${e.shortMessage || e.message}`); }

        try {
          console.log(`  [3] Saving ${formatEther(minContribution)} cUSD...`);
          const tx = await client.writeContract({
            address: POTVAULT_ADDRESS, abi: ABIs, functionName: 'contribute',
            args: [minContribution],
          });
          await publicClient.waitForTransactionReceipt({ hash: tx });
          console.log(`    ✅ Saved: ${tx}`);
          
          // Deduct from local balance tracking so next loop accurately knows if it can save again
          balance -= minContribution;
          canSave = balance >= minContribution;
        } catch(e) { console.error(`    ❌ Contribute failed: ${e.shortMessage || e.message}`); }
      } else {
        console.log(`  [2-3] Insufficient cUSD to save. Skipping.`);
      }

      // ── Free calls — always run regardless of cUSD balance ───────────────────

      // [4] Pick a Draw Number
      try {
        const randomNum = Math.floor(Math.random() * 9) + 1;
        console.log(`  [4] Picking draw number ${randomNum}...`);
        const tx = await client.writeContract({
          address: DRAWMANAGER_ADDRESS, abi: ABIs, functionName: 'pickNumber',
          args: [randomNum],
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log(`    ✅ Picked Number: ${tx}`);
      } catch(e) { console.error(`    ⚠️  Pick skipped: ${e.shortMessage || 'Already picked / draw not open'}`); }

      // [5] Daily Check-In
      try {
        console.log(`  [5] Daily Check-In...`);
        const tx = await client.writeContract({
          address: STREAKSBT_ADDRESS, abi: ABIs, functionName: 'checkIn'
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log(`    ✅ Checked In: ${tx}`);
      } catch(e) { console.error(`    ⚠️  Check-In skipped: ${e.shortMessage || 'Already checked in today'}`); }

      // [6] Spray a random friend
      try {
        const randomFriend = getRandomAddress();
        console.log(`  [6] Spraying ticket to ${randomFriend}...`);
        const tx = await client.writeContract({
          address: SPRAYFAUCET_ADDRESS, abi: ABIs, functionName: 'spray',
          args: [randomFriend]
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log(`    ✅ Sprayed: ${tx}`);
      } catch(e) { console.error(`    ⚠️  Spray skipped: ${e.shortMessage || 'Out of daily sprays'}`); }

      // Small delay between loops
      await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`\n🎉 Finished all loops for Wallet ${i + 1}.\n`);
  }
}

runRealisticRamp(5);
