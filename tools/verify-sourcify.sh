#!/usr/bin/env bash
# Post-deploy Sourcify verification (#94). Verifies every contract in the
# deployment record on Sourcify — the project's standard (sourcify:exact_match).
# Idempotent: forge skips already-verified contracts. No API key needed.
#
# Usage: tools/verify-sourcify.sh [network]   (default: celo-mainnet)
set -euo pipefail

NETWORK="${1:-celo-mainnet}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEP="$ROOT/contracts/deployments/$NETWORK.json"
[ -f "$DEP" ] || { echo "verify-sourcify: no deployment record at $DEP" >&2; exit 1; }

# Read scalars from the JSON via node (already a dependency of tools/).
get() { node -e "const d=require('$DEP');console.log(($1)??'')"; }
CHAIN_ID=$(get "d.chainId")

cd "$ROOT/contracts"

POTVAULT=$(get "d.contracts.PotVault?.address")
STABLECOIN=$(get "d.contracts.PotVault?.stablecoin")
MINCONTRIB=$(get "d.contracts.PotVault?.minContribution")
VERIFIER=$(get "d.contracts.SprayFaucet?.verifier")
KEEPER=$(get "d.contracts.DrawManager?.keeper")

verify() { # <address> <path:Name> [constructor-args-hex]
  local addr="$1" id="$2" ctor="${3:-}"
  [ -n "$addr" ] || return 0
  echo "== $id @ $addr =="
  # shellcheck disable=SC2086
  forge verify-contract "$addr" "$id" --chain-id "$CHAIN_ID" --verifier sourcify \
    ${ctor:+--constructor-args "$ctor"} --watch || echo "  (verification reported an issue — see above)"
}

verify "$POTVAULT" "src/PotVault.sol:PotVault" \
  "$(cast abi-encode 'constructor(address,uint256)' "$STABLECOIN" "$MINCONTRIB")"
verify "$(get 'd.contracts.StreakSBT?.address')" "src/StreakSBT.sol:StreakSBT"
verify "$(get 'd.contracts.SprayFaucet?.address')" "src/SprayFaucet.sol:SprayFaucet" \
  "$(cast abi-encode 'constructor(address,address)' "$POTVAULT" "$VERIFIER")"
verify "$(get 'd.contracts.DrawManager?.address')" "src/DrawManager.sol:DrawManager" \
  "$(cast abi-encode 'constructor(address,address)' "$POTVAULT" "$KEEPER")"
verify "$(get 'd.contracts.CrewRegistry?.address')" "src/CrewRegistry.sol:CrewRegistry"

echo "verify-sourcify: done. Set each 'verification' field in $NETWORK.json to sourcify:exact_match."
