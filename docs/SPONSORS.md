# Ajora Sponsor Kit

Welcome to Ajora! As a sponsor, you fund the daily prize pools in exchange for high-visibility engagement from thousands of on-chain savers.

## What a Campaign Buys

Sponsoring a draw cycle places your brand front-and-center for highly engaged, financially active users.

1. **Branded Draws**: The daily draw will bear your campaign name (e.g., "The Celo Summer Draw"). Your logo and messaging will be visible when users pick their numbers and check the results.
2. **Push Notification Real-Estate**: Every active user receives a push notification when the draw resolves, featuring your brand.
3. **CAC Math vs Telecom Spend**: Unlike traditional SMS marketing (which costs ~$0.02 per message and has terrible conversion rates), sponsoring a $50 daily pot reaches 5,000+ users with guaranteed daily active engagement. That's a CAC (Customer Acquisition Cost) of $0.01 per highly engaged on-chain user, beating telecom spend by orders of magnitude.

## Naming Convention

When funding a campaign, please use the following naming convention in the memo/metadata so our indexer can correctly attribute the draws to you:

`SPONSOR_[YOUR_BRAND]_[CAMPAIGN_NAME]` (e.g., `SPONSOR_CELO_SUMMER_24`)

## How to Fund a Campaign

Use the provided walkthrough script to easily fund the sponsor pool using your wallet. Ensure you have the required cUSD and gas tokens (CELO).

\`\`\`bash
# Fund 50 cUSD for the next draw period
./tools/fund-sponsor-pool.sh 50 "SPONSOR_CELO_SUMMER_24"
\`\`\`

## Performance Tracking

The Ajora indexer automatically tracks:
- Total unique users who participated during your sponsored draws.
- Total new wallets created on the days you sponsored.
- Click-through and engagement metrics on the draw-reveal screens.

Reach out to the team for a detailed performance snapshot at the end of your campaign!
