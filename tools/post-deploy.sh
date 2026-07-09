#!/usr/bin/env bash
# Post-deploy checklist automation (#94).
# Reads the canonical deployment record (or a Foundry broadcast artifact), runs
# Sourcify verification, prints the KarmaGAP registration list, and emits env
# diffs for the app and indexer.
#
# Usage:
#   tools/post-deploy.sh                         # use contracts/deployments/celo-mainnet.json
#   tools/post-deploy.sh --network alfajores     # specify network
#   tools/post-deploy.sh --broadcast <run.json>  # read addresses from a broadcast artifact
#   tools/post-deploy.sh --check                 # CI: verify everything is synced
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

NETWORK="celo-mainnet"
BROADCAST=""
CHECK=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --network) NETWORK="$2"; shift 2 ;;
    --broadcast) BROADCAST="$2"; shift 2 ;;
    --check) CHECK=true; shift ;;
    *) echo "post-deploy: unknown option $1"; exit 1 ;;
  esac
done

DEPLOYMENT="$ROOT/contracts/deployments/$NETWORK.json"
[ -f "$DEPLOYMENT" ] || { echo "post-deploy: no deployment record at $DEPLOYMENT"; exit 1; }

get() { node -e "const d=require('$DEPLOYMENT');console.log(($1)??'')"; }

echo "=============================================="
echo " Ajora post-deploy checklist"
echo " Network: $NETWORK"
echo " Deployment: $DEPLOYMENT"
echo "=============================================="

if [ -n "$BROADCAST" ]; then
  echo ""
  echo "--- Reading broadcast artifact: $BROADCAST ---"
  if [ ! -f "$BROADCAST" ]; then
    echo "post-deploy: broadcast artifact not found at $BROADCAST"
    exit 1
  fi
  # Emit the deployed addresses from the broadcast returns
  node -e "
    const a = require('$BROADCAST');
    const r = a.returns || {};
    const labels = { potVault: 'PotVault', streakSBT: 'StreakSBT', sprayFaucet: 'SprayFaucet', drawManager: 'DrawManager', crewRegistry: 'CrewRegistry' };
    for (const [key, label] of Object.entries(labels)) {
      if (r[key]) {
        const addr = r[key].value && r[key].value.startsWith('0x') ? r[key].value : '0x' + BigInt(r[key].value).toString(16).padStart(40, '0');
        console.log('  ' + label + ': ' + addr.toLowerCase());
      }
    }
  "
  echo ""
  echo "  Update the deployment record with these addresses before proceeding."
  echo ""
fi

echo "--- Step 1: Verify sources on Sourcify ---"
"$ROOT/tools/verify-sourcify.sh" "$NETWORK"
echo ""

echo "--- Step 2: KarmaGAP registration list ---"
echo "  Register these addresses in the KarmaGAP project profile:"
echo ""
for name in PotVault StreakSBT SprayFaucet DrawManager CrewRegistry; do
  addr=$(get "d.contracts.$name?.address")
  if [ -n "$addr" ]; then
    echo "    $name: $addr"
  fi
done
echo ""

echo "--- Step 3: Frontend env sync ---"
if $CHECK; then
  node "$ROOT/tools/sync-env.mjs" --check --network "$NETWORK"
else
  node "$ROOT/tools/sync-env.mjs" --network "$NETWORK"
fi
echo ""

echo "--- Step 4: Indexer env diff ---"
echo "  The indexer (indexer/ponder.config.ts) reads addresses inline."
echo "  Update indexer/ponder.config.ts if these changed:"
echo ""
for name in PotVault StreakSBT SprayFaucet DrawManager CrewRegistry; do
  addr=$(get "d.contracts.$name?.address")
  if [ -n "$addr" ]; then
    echo "    $name: $addr"
  fi
done
echo ""

echo "--- Step 5: Manual steps ---"
echo "  These require a wallet; they are NOT automated:"
echo "  [ ] Register all contract addresses in KarmaGAP project profile"
echo "  [ ] Fund a sponsor campaign:"
echo "      cusd.approve(faucet, X) then faucet.fundSponsorPool(X, 'launch')"
echo "  [ ] Update root README.md deployment table"
echo "  [ ] Post /celo Farcaster update linked to the deploy PR"
echo ""

if $CHECK; then
  echo "post-deploy: checklist synced."
else
  echo "post-deploy: done. Contracts are verified, env is synced."
  echo "  Set each 'verification' field in $NETWORK.json to sourcify:exact_match if not already."
fi
