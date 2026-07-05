# Ajora indexer

[Ponder](https://ponder.sh) app that turns the v3 core contract events on Celo
mainnet into the tables and read APIs behind leaderboards, win cards, and the
growth metrics (issue #14, AJORA_SPEC.md §7/§10/§12).

## Run

```bash
npm install
npm run dev        # backfills from the v3 deploy block, then follows the chain
```

No configuration is required for development: the RPC defaults to public forno
and storage defaults to embedded PGlite. For production set `PONDER_RPC_URL_42220`
(dedicated provider) and `DATABASE_URL` (Postgres) in `.env.local`, and run
`npm start`.

## What gets indexed

Contract addresses come from `contracts/deployments/celo-mainnet.json` (v3 core,
deployed 2026-07-04). `CrewRegistry` joins after the v4 completion run.

| Table | Source events | Notes |
| --- | --- | --- |
| `users` | all user-facing events | aggregates: totals, streak, multiplier, verified |
| `contributions` | `PotVault:Contributed` | one row per deposit |
| `picks` | `DrawManager:NumberPicked` | latest pick per (user, period) |
| `sprays` | `SprayFaucet:Sprayed` | gift feed |
| `draws` | `DrawManager:DrawResolved` | seed, winning number, pot |
| `wins` | `DrawManager:PrizeClaimed` | `claimed` flips on `PotVault:WinningsClaimed` |
| `payouts` | `PrincipalClaimed` / `WinningsClaimed` | wallet history |
| `referrals` | `SprayFaucet:ReferralBonus` | converted invites, feeds k-factor |
| `user_days` | any user-initiated action | one row per (user, day) for DAU/retention |

Tickets are only counted from `PotVault:TicketsCredited` — the faucet credits
odds through the vault, so counting `Sprayed`/`WelcomeTicket` too would double
count. `totalWon` is counted at `DrawManager:PrizeClaimed` (settlement), not at
withdrawal. A period is one UTC day: `periodId == timestamp / 86400`, so period
ids double as day indexes everywhere.

## Read API

Custom endpoints (Hono, `src/api/index.ts`) — bigint wei amounts are serialized
as strings:

- `GET /leaderboard/savers?period=&limit=` — top savers for a period (default today)
- `GET /leaderboard/alltime?by=saved|won|streak&limit=` — all-time boards
- `GET /periods/:id` — running totals, draw result, winners with pro-rata shares
- `GET /users/:address` — profile aggregates + win history (win cards)
- `GET /metrics/daily?days=` — DAU, new users, tx count, principal in, jara paid,
  d1/d7 retention, k-factor per day (spec §12 `daily_metrics`)

Plus the standard Ponder surfaces: GraphQL at `/` and `/graphql`, direct SQL
over HTTP at `/sql/*` (`@ponder/client`).

## Backfill & reorgs

Both are handled by the Ponder runtime: on boot it backfills from `startBlock`
(71,246,000, just before the v3 deploy) and then follows the head. Reorgs are
detected against stored block hashes and rolled back automatically; tables stay
consistent because all writes go through the checkpointed store. Re-syncing
from scratch is always safe (`ponder dev` uses a fresh dev schema per run).
