#!/usr/bin/env bash
set -eo pipefail

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <amount_in_cUSD> <campaign_memo>"
  echo "Example: $0 50 SPONSOR_CELO_SUMMER_24"
  exit 1
fi

AMOUNT_CUSD=$1
CAMPAIGN_MEMO=$2

# Ensure cast is installed
if ! command -v cast &> /dev/null; then
    echo "Foundry (cast) is required. Please install it with: curl -L https://foundry.paradigm.xyz | bash"
    exit 1
fi

# Load environment
if [ -f .env ]; then
  source .env
else
  echo ".env file not found. Ensure PRIVATE_KEY and RPC_URL are set."
  exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
  echo "PRIVATE_KEY is missing in .env"
  exit 1
fi

# We use the mainnet RPC by default if not set
RPC_URL=${RPC_URL:-"https://forno.celo.org"}

# Contract addresses
CUSD_ADDRESS="0x765DE816845861e75A25fCA122bb6898B8B1282a"
# Vault address from DEPLOYMENT.md
VAULT_ADDRESS="0x57d4D9700C330a108A7490A0937a091e988D41C6" 

# Convert cUSD to wei
AMOUNT_WEI=$(cast to-wei "$AMOUNT_CUSD")

echo "=========================================="
echo "Campaign: $CAMPAIGN_MEMO"
echo "Amount: $AMOUNT_CUSD cUSD"
echo "Network: $RPC_URL"
echo "=========================================="

echo "Step 1: Approving PotVault to spend $AMOUNT_CUSD cUSD..."
cast send "$CUSD_ADDRESS" \
  "approve(address,uint256)" "$VAULT_ADDRESS" "$AMOUNT_WEI" \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY"

echo "Step 2: Funding the Sponsor Pool..."
# Assuming PotVault has a fundJara(uint256 period, uint256 amount) or similar function
# Note: For campaigns, the indexer will track the event. Since this is a simple script,
# we invoke fundJara for the current active period.

# Get current period
CURRENT_PERIOD=$(cast call "$VAULT_ADDRESS" "currentPeriod()(uint256)" --rpc-url "$RPC_URL")

cast send "$VAULT_ADDRESS" \
  "fundJara(uint256,uint256)" "$CURRENT_PERIOD" "$AMOUNT_WEI" \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY"

echo "✅ Successfully funded the campaign!"
