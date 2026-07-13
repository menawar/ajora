# Ajora Campus Ambassador Program

The Ambassador Program leverages Ajora's native Crew system for built-in attribution and performance tracking. Ambassadors create custom Crew Codes, allowing the indexer to automatically track their referrals, total savings volume, and conversion rates without any manual counting.

## Technical Tracking via Crew Codes

Ambassadors do not need a separate referral system. 
1. The Ambassador goes to the `/crew` screen.
2. They create a Crew using a specific geographic or campus identifier (e.g., `ajora-lagos-unilag`, `ajora-nairobi-uon`).
3. The Ambassador shares their unique Crew link.
4. The Indexer automatically aggregates all "joins" and "self-funded conversions" per Crew Code. 

*No extra UI is required. The existing Crew board (`/crew`) acts as the "Campus Board" for the ambassador.*

## Ambassador Playbook

### Step 1: Claim Your Code
Ambassadors must claim a highly recognizable crew code. Good examples:
- `ajora-[city]-[university]`
- `ajora-[ambassador-name]-[city]`

### Step 2: Pitching Ajora
When pitching to students:
- Emphasize the "No-loss" aspect: "Save small small, keep your money, chop jara."
- Walk them through connecting a wallet via MiniPay.
- Make them click your Crew Link so they are attributed to your group.

### Step 3: Weekly Summary Format
Every Friday, the Growth team pulls a summary from the Indexer using the Crew metric rollups. We post this on the community channels:

**Format:**
```
🌟 Weekly Campus Leaderboard 🌟

1. 🥇 Univ of Lagos (ajora-lagos-unilag): 145 members | 500 cUSD TVL
2. 🥈 Univ of Nairobi (ajora-nairobi-uon): 98 members | 350 cUSD TVL
3. 🥉 Ashesi Univ (ajora-accra-ashesi): 45 members | 120 cUSD TVL

🔥 Top Converter: [Ambassador Name] with 85% of crew members actively saving!
```

## Indexer Rollups (For Backend Teams)
The Indexer provides the data for the weekly posts. The query groups by `crewCode`:
- **Joins**: Count of unique `CrewJoined` events per code.
- **Conversions**: Count of users in that crew who have `PrincipalDeposited > 0`.
- **TVL**: Sum of `PrincipalDeposited` for all active users in that crew.
