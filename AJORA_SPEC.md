# Ajora — Full Product & Technical Specification

> **Ajora 🎉** — *"Save 0.10 cUSD a day, keep every cent, and win real stablecoin in the daily draw — then spray free tickets on your friends like it's an owambe."*
>
> *The name blends **Ajo** (the trusted savings circle) with **jara** (the free bonus you always keep). "Ajora" also means "deep" in Wolaita — a deep pool of savings. Tagline: "Save small, keep every cent, chop jara."*

**Version:** 1.0
**Status:** Build-ready spec for Celo Proof of Ship submission
**Target platform:** MiniPay Mini App (Celo mainnet)
**Build window:** 4 weeks, small team (Solidity + TypeScript/React)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Design Principles & Constraints](#2-design-principles--constraints)
3. [User Personas](#3-user-personas)
4. [Core Gameplay Loop](#4-core-gameplay-loop)
5. [Viral Growth Mechanic](#5-viral-growth-mechanic)
6. [Reward Economics](#6-reward-economics)
7. [System Architecture](#7-system-architecture)
8. [Smart Contract Specifications](#8-smart-contract-specifications)
9. [Randomness & Draw Resolution](#9-randomness--draw-resolution)
10. [Backend / Keeper Services](#10-backend--keeper-services)
11. [Frontend / Mini App Specification](#11-frontend--mini-app-specification)
12. [Data Model](#12-data-model)
13. [Anti-Sybil & Security](#13-anti-sybil--security)
14. [Metrics & Analytics](#14-metrics--analytics)
15. [4-Week Build Plan](#15-4-week-build-plan)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Open Questions](#17-open-questions)
18. [Glossary](#18-glossary)

---

## 1. Product Overview

**Ajora** is a **no-loss prize-linked savings game** built as a MiniPay Mini App on Celo. It digitizes the continent's most-trusted money ritual — the rotating savings group (**Ajo** in Nigeria, **Esusu**, **Chama** in Kenya, **Susu** in Ghana) — and makes the organizer impossible: the smart contract holds funds, so nobody can run away with the money.

Users save tiny amounts of Mento stablecoins (cUSD / cKES / cCOP) daily. **Principal is always returned in full** (no-loss). A daily draw distributes a **jara pot** (the bonus), funded by yield on pooled savings + sponsors + rake — never by principal. A Nigerian *owambe*-inspired **"spray"** mechanic lets users gift free, sponsor-funded tickets to friends, which is the core viral loop.

**Why it's not play-to-earn slop:** there is no speculative token to buy, no principal at risk, and every reward traces to real external revenue. The on-chain design exists for a genuine reason — a shared, custody-free money pool that must be provably fair.

### One-line pitches by region

| Region | Pitch |
|---|---|
| Nigeria (Pidgin) | "Save small-small, keep your money, chop jara for the daily draw. Spray your padi free ticket!" |
| Kenya (Swahili-inflected) | "Weka pesa kidogo, hold your money, win the daily chama bonus." |
| Ghana | "Do susu, keep your money, win the daily draw. Bless your friend with a free ticket." |

---

## 2. Design Principles & Constraints

### Hard constraints (non-negotiable)

- **Understandable in <10 seconds** by a non-crypto user.
- **No upfront deposit** required to start playing — first win possible with zero spend.
- **Every on-chain action has a genuine reason** — no fake/padding transactions.
- **Viral loop baked into the core mechanic** — not bolted on.
- **Sustainable economics** — rewards traceable to real revenue, not new deposits.
- **Low-end Android + mobile data** — small bundle, minimal RPC calls, offline-tolerant UI, aggressive caching.
- **Buildable in ~4 weeks** by a small team with mainnet deployment.

### Design principles

1. **Principal is sacred.** The word "no-loss" appears everywhere in the UI. Trust is the product.
2. **The fun action IS the transaction.** Saving, picking, spraying, claiming — each is one on-chain tx the user *wants* to do.
3. **Status over bribes.** Spraying makes you look generous (owambe status), which is a stronger driver than a referral kickback.
4. **Self-balancing rewards.** Prizes are a *share of real revenue this period*, algorithmically capped. The pot can never run dry or become a Ponzi.
5. **Gas is invisible.** Near-zero gas paid in stablecoin; users never think about it.

---

## 3. User Personas

| Persona | Profile | Motivation | Design implication |
|---|---|---|---|
| **Amara (Lagos, 24)** | Petty trader, low-end Android, uses WhatsApp all day, does offline Ajo | Save discipline + small wins, distrust of organizers | No-loss guarantee, tiny amounts, daily habit |
| **Kevin (Nairobi, 28)** | Boda-boda rider, member of 2 chamas, new to crypto | Real cash, community status | Crew mechanic, leaderboards, sprays |
| **Kwame (Accra, 21)** | Student, influencer wannabe, always online | Clout, shareable wins, easy money | Win cards, #AjoraChallenge, spray flexing |
| **Bot farmer** | Adversary creating fake accounts | Farm free tickets & referral bonuses | Anti-sybil is a first-class feature |

---

## 4. Core Gameplay Loop

A session is **~40 seconds**. Target **3–6 on-chain transactions per active user per day**.

```
┌─────────────────────────────────────────────────────────────┐
│  1. OPEN (in MiniPay)                                        │
│     → New user: free 0.10 cUSD welcome ticket, sponsor-paid  │
│       (welcomeTicket() tx). Can win day one, zero spend.     │
├─────────────────────────────────────────────────────────────┤
│  2. SAVE                                                     │
│     → Tap "Save" → contribute() ~$0.10+ cUSD into today's    │
│       PotVault. This is the real deposit. [1 tx]             │
├─────────────────────────────────────────────────────────────┤
│  3. PICK                                                     │
│     → Choose lucky number 1–9 for tonight's draw.            │
│       More saved this week = more tickets = better odds.     │
│       pickNumber() [1 tx]                                    │
├─────────────────────────────────────────────────────────────┤
│  4. SPRAY                                                    │
│     → Tap a friend's face → spray(friend) a free sponsor     │
│       ticket. Confetti. [1–3 tx]  ← viral engine             │
├─────────────────────────────────────────────────────────────┤
│  5. DRAW (8 PM daily)                                        │
│     → resolveDraw() (keeper) picks winners via VRF.          │
│       Winners split the jara pot. Principal untouched.       │
├─────────────────────────────────────────────────────────────┤
│  6. CLAIM + SHARE                                            │
│     → claimPrize() / claimWinnings() [1 tx, occasional]      │
│     → Auto-generated "I chopped 2 cUSD 💸" card → WhatsApp   │
│     → Streak multiplier ticks up (checkIn() tx)              │
└─────────────────────────────────────────────────────────────┘
```

### Session state machine

```
NEW ──welcomeTicket──▶ ONBOARDED ──contribute──▶ SAVED_TODAY
   ──pickNumber──▶ ENTERED ──spray(n)──▶ SPRAYED
   ──(8PM resolveDraw)──▶ DRAWN ──claim──▶ CLAIMED ──(next day)──▶ RETURNING
   miss a day ──▶ STREAK_RESET (multiplier → 1x, principal safe)
```

---

## 5. Viral Growth Mechanic

### The engine: Money Spray (owambe culture)

Nigerian party culture "sprays" cash on celebrants as joy + status. Ajora digitizes this:

- **Spraying costs the user nothing** — tickets are drawn from the sponsor faucet.
- **It confers status** — you look like a *big man* to your crew (the primary driver).
- **The recipient gets real money with no deposit** → activation conversion 35–40% because there's zero risk and no crypto to buy. This is why **k > 1**.

### Crews (squads) — the pull, not just push

- Users form **crews** (5–20 friends).
- Crew's **combined weekly savings** unlocks a bigger **shared bonus pot**.
- Members actively recruit and nag inactive members → drives retention for the whole crew.
- **Crew leaderboards** (savings volume, win count) create rivalry.

### Referral attribution (on-chain)

- Each user gets a `refCode`. `joinCrew(refCode)` records the inviter on-chain.
- **Referral reward vests only after the referred user completes 3 days of self-funded saves** — a fake account earns the inviter nothing (anti-sybil).

### Shareable wins

- Every win generates a branded card: *"I chopped X cUSD today with Ajora 💸"*.
- **No loss cards exist** (no-loss game) → sharing is always positive-emotion.
- Share targets: WhatsApp status/groups (primary), Farcaster (secondary, for crypto-native reach + Celo ecosystem visibility).

### Viral coefficient model

```
Seed users (week 1):        200 (ambassadors + 1 WhatsApp community)
Sprays per active user/day: ~2.5
Activation of sprayed:      35–40% (free money, no deposit)
Viral coefficient k:        ≈ 1.3
Daily return trigger:       8 PM draw + streak
→ Month-end estimate:       6,000–12,000 users, 250k–500k txs
```

---

## 6. Reward Economics

**No Ajora token exists.** Rewards are paid in Mento stablecoins. Principal is always returned. The **jara (bonus)** is funded by real external revenue:

| Source | Description | Timeline |
|---|---|---|
| **1. Yield on pooled savings** | All contributions routed to a low-risk Celo lending market; yield funds prizes (PoolTogether model). Principal untouched. | Scales with TVL |
| **2. Sponsors (primary early)** | Telecoms (Safaricom, MTN, Airtel), fintechs, FMCG fund branded draws ("MTN Mega Jara") + buy spray tickets. Cheaper user acquisition than their current CAC → real marketing budget. | Week 3+ |
| **3. Rake on paid "Big Pot" tiers** | Free tier stays free; optional whale pots take a small rake. | Week 3+ |
| **4. Sinks** | "Boost odds" micro-purchases; broken streaks forfeit only the multiplier; unclaimed prizes recycle. | Week 2+ |
| **5. Bootstrap (disclosed)** | Month-1 pots partly seeded by Proof of Ship rewards + grants. Transparent flywheel. | Month 1 |

### Why it is NOT a Ponzi (state plainly in UI + docs)

1. **Principal never at risk** — worst case a user withdraws exactly what they deposited.
2. **Prizes come from outside the pool** — yield + sponsor budgets + rake, not later users' deposits.
3. **Algorithmic prize cap** — payout ≤ real revenue this period. No fixed APY, no guaranteed returns. Self-balances; cannot run dry.

### Prize sizing formula

```
jara_pot(day) = yield_harvested(day)
              + sponsor_budget_allocated(day)
              + rake_collected(day)
              + recycled_unclaimed(prior)
              - protocol_fee

prize_per_winner = jara_pot(day) * winner_share / num_winners

# Hard invariant: sum(prizes) <= jara_pot(day). Never exceed real revenue.
```

---

## 7. System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         MiniPay (Celo wallet)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Ajora Mini App (Next.js/TS)                  │   │
│  │  - Save / Pick / Spray / Claim UI                        │   │
│  │  - Win-card generator + WhatsApp/Farcaster share         │   │
│  │  - viem/wagmi + MiniPay injected provider                │   │
│  └───────────────┬──────────────────────────┬───────────────┘   │
└──────────────────┼──────────────────────────┼───────────────────┘
                   │ read (indexer/RPC)        │ write (txs)
                   ▼                            ▼
        ┌──────────────────┐        ┌──────────────────────────┐
        │  Indexer/API     │        │   Celo mainnet contracts │
        │  (Ponder/Subgraph│◀───────│  PotVault, DrawManager,  │
        │   + Postgres)    │  events│  SprayFaucet, Crew, SBT, │
        │  leaderboards,   │        │  YieldAdapter, Treasury  │
        │  metrics, cards  │        └───────────┬──────────────┘
        └────────▲─────────┘                    │
                 │                               │
        ┌────────┴─────────┐          ┌──────────┴───────────┐
        │ Keeper service   │─────────▶│  VRF/drand oracle    │
        │ (cron: resolve   │          │  (verifiable random) │
        │  draw, harvest)  │          └──────────────────────┘
        └────────┬─────────┘
                 │
        ┌────────┴─────────┐
        │ Push service     │  (draw results, streak reminders)
        └──────────────────┘
```

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| Contracts | Solidity 0.8.24, Foundry | Fast iteration, fuzzing, mainnet-grade |
| Chain | Celo mainnet (Alfajores for staging) | Near-zero gas, stablecoin gas, MiniPay-native |
| Stablecoins | cUSD, cKES, cCOP (Mento) | Local-currency relevance |
| Frontend | Next.js (App Router) + TypeScript + Tailwind | TS-first, static export keeps the client bundle lean for low-end Android |
| Web3 lib | viem + wagmi | Lightweight, MiniPay injected provider support |
| Indexer | Ponder (or The Graph) + Postgres | Fast reads, leaderboards, metrics |
| Keeper | Node.js cron worker | Draw resolution, yield harvest |
| Randomness | drand / VRF oracle + commit-reveal | Verifiable, Celo-compatible |
| Yield | Audited Celo lending market (e.g., Aave-family/Moola-style) | Sustainable prize funding |
| Push | Web push / MiniPay notifications | Retention |

---

## 8. Smart Contract Specifications

### Contract inventory

| Contract | Responsibility | Tx-generating functions |
|---|---|---|
| `PotVault` | Custody savings, tickets, return principal | `contribute`, `claimPrincipal`, `claimWinnings` |
| `DrawManager` | Run draw, VRF, split jara | `pickNumber`, `resolveDraw`, `claimPrize` |
| `SprayFaucet` | Sponsor funds, dispense free tickets | `welcomeTicket`, `spray` |
| `CrewRegistry` | Squads + on-chain referral | `createCrew`, `joinCrew` |
| `StreakSBT` | Non-transferable streak/badge tokens | `checkIn`, `mintBadge` |
| `YieldAdapter` | Route idle pool to lending, harvest | `deposit`, `withdraw`, `harvest` |
| `Treasury` | Rake, fees, accounting | fee settlement |

### 8.1 `PotVault`

Holds all contributions for a given period (daily pot). Tracks tickets. Guarantees principal return.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPotVault {
    struct Period {
        uint256 id;             // e.g., YYYYMMDD
        uint256 totalPrincipal; // sum of all contributions (always redeemable)
        uint256 jaraPot;        // bonus pool (yield + sponsor + rake)
        uint256 totalTickets;
        bool    resolved;
        uint256 vrfSeed;
    }

    event Contributed(address indexed user, uint256 indexed periodId, uint256 amount, uint256 ticketsMinted);
    event PrincipalClaimed(address indexed user, uint256 indexed periodId, uint256 amount);
    event WinningsClaimed(address indexed user, uint256 indexed periodId, uint256 amount);

    /// @notice Deposit stablecoin into the current period. Mints tickets.
    /// @dev Reverts if amount < MIN_CONTRIBUTION. Applies streak multiplier to tickets.
    function contribute(uint256 amount, address token) external returns (uint256 ticketsMinted);

    /// @notice Withdraw your principal for a period (no-loss guarantee). Always available post-resolve.
    function claimPrincipal(uint256 periodId) external returns (uint256 amount);

    /// @notice Claim winnings if you won (settled by DrawManager).
    function claimWinnings(uint256 periodId) external returns (uint256 amount);

    /// @notice Current active period id.
    function currentPeriod() external view returns (uint256);

    function ticketsOf(address user, uint256 periodId) external view returns (uint256);
    function principalOf(address user, uint256 periodId) external view returns (uint256);
}
```

**Key rules:**
- `MIN_CONTRIBUTION` ≈ $0.10 equivalent per token.
- Tickets = `amount_normalized * streakMultiplier(user)`. Streak multiplier comes from `StreakSBT` (1x–3x).
- Principal is escrowed separately from `jaraPot` — **contracts must never pay prizes from principal** (enforced by accounting invariant + tests).
- Idle principal is forwarded to `YieldAdapter`; a liquidity buffer (e.g., 10%) stays in-vault for instant withdrawals.
- `token` restricted to whitelisted Mento stablecoins.

### 8.2 `DrawManager`

Resolves the daily draw using verifiable randomness and splits the jara pot.

```solidity
interface IDrawManager {
    event NumberPicked(address indexed user, uint256 indexed periodId, uint8 number);
    event DrawResolved(uint256 indexed periodId, uint256 vrfSeed, uint8 winningNumber, uint256 numWinners, uint256 potSplit);
    event PrizeClaimed(address indexed user, uint256 indexed periodId, uint256 amount);

    /// @notice Commit your lucky number (1–9) for the current period.
    /// @dev One pick per user per period. Weighted by ticket count for odds.
    function pickNumber(uint8 number) external;

    /// @notice Keeper-only. Consumes VRF seed, derives winning number, splits jaraPot.
    /// @dev Reverts if VRF not yet fulfilled or period not ended.
    function resolveDraw(uint256 periodId) external;

    /// @notice Claim prize into PotVault balance for later withdrawal (or auto-forward).
    function claimPrize(uint256 periodId) external returns (uint256 amount);

    function isWinner(address user, uint256 periodId) external view returns (bool);
}
```

**Draw logic:**
- Winning number derived from VRF seed: `winning = (seed % 9) + 1`.
- Winners = all users who both **picked the winning number** AND hold tickets; prize weighted by ticket count.
- If no winner picked the number, jara recycles into next period (a sink).
- Merit + luck blend: more saving = more tickets = larger share of prize when you win.

### 8.3 `SprayFaucet`

Holds sponsor money; dispenses free tickets for onboarding and spraying.

```solidity
interface ISprayFaucet {
    event SponsorFunded(address indexed sponsor, uint256 amount, bytes32 campaignId);
    event WelcomeTicket(address indexed user, uint256 value);
    event Sprayed(address indexed from, address indexed to, uint256 value);

    /// @notice Sponsor deposits budget for a campaign.
    function fundSponsorPool(uint256 amount, bytes32 campaignId) external;

    /// @notice One-time free ticket for a newly verified user.
    /// @dev Gated by proof-of-personhood; caps free value per human.
    function welcomeTicket(address user) external;

    /// @notice Gift a free (sponsor-funded) ticket to a friend.
    /// @dev Rate-limited per sender per day. Only to phone-verified recipients.
    function spray(address friend) external;

    function dailySpraysLeft(address user) external view returns (uint256);
}
```

**Anti-drain rules:**
- `welcomeTicket` gated by MiniPay phone verification + Self protocol; hard cap on free value per human.
- `spray` rate-limited (e.g., 3/day), only to phone-verified recipients.
- Sponsor budget is the settlement source; faucet cannot exceed funded balance.

### 8.4 `CrewRegistry`

Squads and on-chain referral attribution.

```solidity
interface ICrewRegistry {
    event CrewCreated(uint256 indexed crewId, address indexed owner, bytes32 refCode);
    event CrewJoined(uint256 indexed crewId, address indexed member, address indexed referrer);
    event ReferralVested(address indexed referrer, address indexed referred, uint256 reward);

    function createCrew(bytes32 refCode) external returns (uint256 crewId);
    function joinCrew(bytes32 refCode) external returns (uint256 crewId);

    /// @dev Called by keeper after referred user completes 3 self-funded saves.
    function vestReferral(address referred) external;

    function crewOf(address user) external view returns (uint256);
    function crewSavings(uint256 crewId, uint256 periodId) external view returns (uint256);
}
```

**Referral vesting:** reward accrues to referrer only after the referred user completes **3 days of self-funded saves** (not sprayed tickets). Anti-sybil core.

### 8.5 `StreakSBT`

Non-transferable (soulbound) tokens recording streaks + badges. Drives ticket multiplier.

```solidity
interface IStreakSBT {
    event CheckedIn(address indexed user, uint256 streakDays, uint8 multiplier);
    event BadgeMinted(address indexed user, uint256 badgeId);

    /// @notice Records a daily check-in; extends or resets streak.
    function checkIn() external;

    /// @notice Ticket multiplier from current streak (1x–3x, capped).
    function multiplierOf(address user) external view returns (uint8);

    function streakOf(address user) external view returns (uint256);
    // Soulbound: transfer functions revert.
}
```

**Multiplier tiers (tunable):** 1–6 days = 1x, 7–29 = 1.5x (×10 fixed-point), 30–89 = 2x, 90+ = 3x. Miss a day → reset to 1x (principal always safe; only the *bonus multiplier* is forfeited — a sink).

### 8.6 `YieldAdapter`

Routes idle pooled principal to an audited Celo lending market; harvests yield into `jaraPot`.

```solidity
interface IYieldAdapter {
    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event Harvested(uint256 yieldAmount, uint256 indexed periodId);

    function deposit(uint256 amount) external;         // vault-only
    function withdraw(uint256 amount) external;         // vault-only, honors buffer
    function harvest(uint256 periodId) external;        // keeper; sends yield to PotVault.jaraPot
    function totalDeployed() external view returns (uint256);
}
```

**Safety:** whitelisted venue only, deposit caps, timelock on venue changes, keep a withdrawal buffer in-vault. Yield venue must be audited; smart-contract risk is a named risk (§16).

### 8.7 `Treasury`

Collects rake/fees, holds protocol funds, funds recycled prizes.

```solidity
interface ITreasury {
    event RakeCollected(uint256 amount, uint256 indexed periodId);
    event FeeWithdrawn(address indexed to, uint256 amount);

    function collectRake(uint256 amount, uint256 periodId) external;   // from paid Big Pots
    function sweepUnclaimed(uint256 periodId) external;                // recycle after N days
}
```

### Contract interaction diagram

```
User ──contribute──▶ PotVault ──idle──▶ YieldAdapter ──harvest──▶ PotVault.jaraPot
User ──pickNumber──▶ DrawManager                                        │
Keeper ─resolveDraw─▶ DrawManager ◀──reads tickets── PotVault           │
User ──spray──▶ SprayFaucet ◀──funds── Sponsor                          │
User ──joinCrew──▶ CrewRegistry ──vest(3 saves)──▶ referral reward      │
User ──checkIn──▶ StreakSBT ──multiplier──▶ PotVault (ticket weighting)◀┘
Paid Big Pot rake ──▶ Treasury ──recycle unclaimed──▶ jaraPot
```

---

## 9. Randomness & Draw Resolution

**Requirement:** publicly verifiable, manipulation-resistant randomness on Celo. Celo lacks turnkey Chainlink VRF everywhere — treat this as real engineering, not a checkbox.

**Approach (layered):**

1. **Primary:** drand (League of Entropy) beacon or a VRF oracle. Keeper fetches the round for the period, submits proof on-chain; contract verifies before use.
2. **Commit-reveal fallback:** users' picks are committed before the seed is knowable; seed published on-chain post-period so anyone can recompute `winning = (seed % 9) + 1`.
3. **Verifiability:** `DrawResolved` event publishes `vrfSeed` + `winningNumber`. Anyone can independently verify the draw.

**Anti-manipulation:**
- Picks close (`pickNumber` reverts) before seed is fetched.
- Keeper cannot choose the seed (comes from external beacon with proof).
- `resolveDraw` is permissionless-verifiable even if keeper-triggered.

---

## 10. Backend / Keeper Services

Stateless workers; all authoritative state is on-chain. Backend is for automation, indexing, and UX.

| Service | Trigger | Action |
|---|---|---|
| **Draw keeper** | Cron 8 PM daily | Fetch VRF/drand proof → `resolveDraw(periodId)` |
| **Harvest keeper** | Cron (e.g., hourly) | `YieldAdapter.harvest()` → top up jaraPot |
| **Referral vester** | On indexer signal (referred hits 3 self-funded saves) | `vestReferral(user)` |
| **Sweep keeper** | Cron daily | `Treasury.sweepUnclaimed()` after N-day window |
| **Indexer** | Event stream | Populate Postgres: leaderboards, crews, metrics, win cards |
| **Push service** | Post-draw + streak-risk | Notify winners, remind streak-at-risk users |

**Keeper resilience:** idempotent calls, retries with backoff, dead-man's-switch alert if a draw is missed. Draw resolution is verifiable/permissionless so a stalled keeper doesn't lock funds.

---

## 11. Frontend / Mini App Specification

### Constraints

- **Bundle < 300 KB gzipped** initial load (low-end Android, mobile data).
- **Offline-tolerant:** cache last state, queue actions, optimistic UI.
- **One-thumb operation**, large tap targets, minimal text.
- **MiniPay injected provider** for wallet (no external wallet connect flow).
- **Local stablecoin display** (cUSD / cKES / cCOP) — amounts shown in the token the user holds, no fiat conversion required.

### Key screens

| Screen | Purpose | Primary CTA |
|---|---|---|
| **Home** | Today's pot size, your streak, countdown to 8 PM | "Save now" |
| **Save** | Amount picker (0.10 / 0.50 / custom cUSD), token select | `contribute()` |
| **Pick** | Number pad 1–9, shows your ticket count | `pickNumber()` |
| **Crew** | Your crew, member activity, crew pot, spray friends | `spray()` |
| **Draw (8 PM)** | Live reveal animation, win/lose result | `claimPrize()` |
| **Win card** | Auto-generated shareable image | Share to WhatsApp/Farcaster |
| **Leaderboard** | Crew + individual rankings | Invite / join crew |
| **Wallet** | Principal balance, withdraw anytime | `claimPrincipal()` |

### Onboarding flow (zero-deposit)

```
1. Open in MiniPay → phone already verified by wallet
2. "Welcome! Here's your free 0.10 cUSD ticket 🎉" → welcomeTicket() (gasless-feel, sponsor pays)
3. "Pick your lucky number" → pickNumber()
4. "Come back at 8 PM to see if you won"
5. (Optional) "Save your own 0.10 cUSD to double your tickets"
→ User has 2+ on-chain txs before spending a cent.
```

### Share card spec

- Rendered client-side (canvas) → PNG.
- Content: amount won, crew name, streak flame, Ajora logo, "Join my crew" deep link with `refCode`.
- Deep link opens Mini App → pre-fills `joinCrew(refCode)`.

### Transaction UX

- Batch where possible (e.g., `contribute` + `pickNumber` + `checkIn` in one user action via multicall if supported).
- Optimistic UI: show success immediately, reconcile on confirmation.
- Gas abstracted: display "Free" / near-zero; pay gas in stablecoin.
- Failed tx → clear retry, never lose user's place.

---

## 12. Data Model

### On-chain (source of truth)

- `PotVault`: `Period` structs, `tickets[user][periodId]`, `principal[user][periodId]`.
- `DrawManager`: `picks[user][periodId]`, resolved seeds, winners.
- `CrewRegistry`: crews, memberships, referral graph.
- `StreakSBT`: streaks, badges, multipliers.

### Off-chain (indexer / Postgres — derived, for reads)

```sql
-- Users
users(address PK, phone_hash, joined_at, crew_id, ref_code, referred_by,
      total_saved, total_won, current_streak, multiplier, verified)

-- Periods
periods(id PK, total_principal, jara_pot, total_tickets, winning_number,
        num_winners, resolved_at, vrf_seed)

-- Contributions
contributions(id PK, user_address, period_id, amount, token, tickets, tx_hash, ts)

-- Picks
picks(user_address, period_id, number, tx_hash, ts)

-- Sprays
sprays(id PK, from_address, to_address, value, campaign_id, tx_hash, ts)

-- Crews
crews(id PK, owner, ref_code, name, member_count, total_savings)

-- Wins
wins(user_address, period_id, amount, claimed, tx_hash)

-- Metrics rollups (materialized views)
daily_metrics(date, dau, new_users, tx_count, principal_in, jara_paid,
              retention_d1, retention_d7, k_factor)
```

---

## 13. Anti-Sybil & Security

### Anti-Sybil (a first-class feature — the AI scorer discounts farmed metrics)

| Vector | Mitigation |
|---|---|
| Fake accounts farming welcome tickets | Gate `welcomeTicket` behind MiniPay phone verification + **Self protocol** (proof-of-personhood). Hard cap free value per human. |
| Spray farming | Rate-limit `spray` (3/day); only to phone-verified recipients; sprayed value can't be withdrawn until recipient self-funds. |
| Referral farming | **Referral vests only after referred user completes 3 self-funded saves.** Fake accounts earn nothing. |
| Wash/self-dealing | On-chain heuristics in indexer; flag ring patterns; exclude from leaderboards & rewards. |
| Withdrawal abuse | Require a minimum self-funded contribution to unlock withdrawals above the free-ticket tier. |

### Smart contract security

- **Foundry test suite:** unit + fuzz + invariant tests. Core invariant: `sum(prizes) <= jaraPot` and `principal never pays prizes`.
- **Reentrancy guards** on all external value transfers (checks-effects-interactions).
- **Access control:** roles for keeper, sponsor, admin (OpenZeppelin `AccessControl`).
- **Deposit caps** during month 1 (limit blast radius).
- **Pausability** (circuit breaker) with timelock on unpause.
- **Timelock** on yield-venue changes and parameter updates.
- **Whitelist** stablecoins and yield venues.
- **Audit:** at minimum a self-audit + Slither/Mythril; budget for a lightweight external review before scaling TVL.
- **Yield venue risk:** only audited venues; buffer for instant withdrawals; monitor venue health.

### Regulatory posture

- **No-loss / prize-linked savings** structure keeps Ajora closer to legal savings-with-rewards than gambling.
- Keep stakes tiny; geo-compliance checks; clear T&Cs; no guaranteed returns language.
- Prizes framed as promotional draws funded by sponsors/yield.

---

## 14. Metrics & Analytics

### Proof of Ship target metrics

| Metric | Target (month 1) | How Ajora drives it |
|---|---|---|
| Unique users | 6,000–12,000 | Spray virality (k≈1.3) + zero-deposit onboarding |
| Total transactions | 250k–500k | 3–6 genuine txs/user/day |
| Retention (D1/D7) | Strong | Daily 8 PM draw + streak multipliers |
| GitHub commit consistency | Daily | See build plan §15 |
| Demo quality | High | 60-sec live: save → spray → win → share |

### Instrumentation

- Every contract action emits an event → indexed → `daily_metrics` rollup.
- Dashboard (for the demo + ongoing): DAU, new users, tx count, principal in, jara paid, k-factor, retention cohorts, crew growth.
- Sybil-adjusted metrics: report both raw and human-verified counts.

### Transaction accounting (honesty check)

Per active user/day: welcome-claim (once) + save (1) + pick (1) + spray (1–3) + occasional claim + crew/checkin ≈ **3–6 tx**. All map to real gameplay — no padding.

---

## 15. 4-Week Build Plan

Proof of Ship rewards **commit consistency + climbing metrics + demo quality**. Ship something live every week; commit daily.

### Week 1 — Core loop on testnet

- [ ] `PotVault`: `contribute`, `claimPrincipal`, `claimWinnings`, ticket accounting.
- [ ] `SprayFaucet`: `welcomeTicket` (zero-deposit onboarding).
- [ ] Foundry tests: principal-safety invariant.
- [ ] Deploy to **Alfajores testnet**.
- [ ] MiniPay Mini App shell (React + viem + MiniPay provider).
- [ ] End-to-end: welcome → save → (mock draw) → claim.
- **PoS milestone:** daily commits; working testnet demo.

### Week 2 — Draw, streaks, spray, crews → mainnet (capped)

- [ ] `DrawManager` + VRF/drand integration + commit-reveal.
- [ ] `StreakSBT` (check-in, multiplier).
- [ ] `SprayFaucet.spray` + rate limits.
- [ ] `CrewRegistry` + on-chain referral.
- [ ] Shareable win cards + WhatsApp deep links.
- [ ] Draw keeper service + indexer (Ponder + Postgres).
- [ ] **Deploy core to Celo mainnet with tight deposit caps.**
- [ ] Onboard first ~100 real users (friends & family + 1 community).
- **PoS milestone:** first mainnet users + txs; retention cohort begins.

### Week 3 — Yield, sponsors, growth

- [ ] `YieldAdapter` → audited Celo lending venue; `harvest` keeper.
- [ ] `Treasury` rake + unclaimed recycle.
- [ ] Sponsor pool live; sign **1–2 anchor sponsors** (LOIs → funded campaigns).
- [ ] Leaderboards, crew competitions, Farcaster share.
- [ ] Push notifications (draw results, streak reminders).
- [ ] Growth push: campus ambassadors (Lagos/Nairobi/Accra), micro-influencer #AjoraChallenge.
- [ ] Scale to **1,000+ users**.
- **PoS milestone:** steepening user/tx curve; sponsor = sustainability proof.

### Week 4 — Harden, polish, blitz, submit

- [ ] Anti-sybil hardening (Self protocol, referral vesting, rate limits).
- [ ] Slither/Mythril pass + fixes; deposit caps reviewed.
- [ ] Analytics dashboard for the demo.
- [ ] Record **60-second demo video** (live save → spray → win → share).
- [ ] Final growth blitz; close month strong.
- [ ] Submit to Proof of Ship.
- **PoS milestone:** peak metrics + high-quality demo.

---

## 16. Risks & Mitigations

### Risk 1 — Sybil / bot farming

**Threat:** fake accounts farm free spray tickets + referral bonuses → inflate fake users, drain sponsor pool, and the AI scorer discounts obviously-farmed metrics.

**Mitigation:**
- Gate free tickets behind MiniPay phone verification + **Self protocol** (proof-of-personhood); cap free value per human.
- **Referral rewards vest only after 3 days of self-funded saves** by the referred user.
- Rate-limit sprays; sprayed value unwithdrawable until recipient self-funds.
- On-chain ring-detection heuristics; exclude flagged accounts from rewards & leaderboards.

### Risk 2 — Cold-start funding / prize sustainability

**Threat:** before sponsors sign and before pooled yield is meaningful, the jara could underdeliver (churn) or you overspend to fake it (Ponzi optics, cash burn).

**Mitigation:**
- **Algorithmic prize cap:** payout ≤ real revenue this period. Structurally impossible to run dry.
- Line up **1–2 anchor sponsor LOIs pre-launch**.
- Bootstrap month 1 transparently with grant / PoS rewards.
- **No-loss guarantee is the safety net:** worst case, users lose nothing → churn ≠ anger.
- Prizes are "share of the pot," not fixed amounts → self-balancing.

### Honorable-mention risks

| Risk | Mitigation |
|---|---|
| Smart-contract / oracle exploit | Audits, fuzz/invariant tests, deposit caps, timelock, pausability, audited yield venue |
| Randomness manipulation | drand/VRF with on-chain proof; commit-reveal; permissionless verification |
| Regulatory (lottery/money transmission) | No-loss = prize-linked savings not gambling; tiny stakes; geo-compliance; clear T&Cs |
| Keeper downtime | Idempotent retries, dead-man's-switch alert, permissionless-verifiable draws |
| Yield venue failure | Whitelisted audited venues only, withdrawal buffer, health monitoring |

---

## 17. Open Questions

1. **VRF source:** confirm drand vs a Celo-compatible VRF oracle — verify availability and latency on mainnet.
2. **Yield venue:** which audited Celo lending market has best risk-adjusted yield + instant liquidity for the buffer?
3. **Multicall:** does MiniPay's provider support batched txs for the save+pick+checkin combo? If not, sequence with optimistic UI.
4. **Sponsor legal:** template agreement for sponsor campaigns; who holds sponsor funds pre-deployment?
5. **Local stablecoin coverage:** confirm Mento liquidity for cKES/cCOP prizes and FX at cash-out; track **cGHS/cNGN** rollout so Ghana/Nigeria users can hold a Cedi/Naira-pegged **stablecoin** (not fiat). Until those are live, denominate everything in cUSD.
6. **Draw cadence:** validate 8 PM WAT/EAT as optimal engagement window per region (may need per-region draws).
7. **Proof-of-personhood UX:** Self protocol onboarding friction vs sybil resistance trade-off — measure drop-off.

---

## 18. Glossary

| Term | Meaning |
|---|---|
| **Ajora** | The product name — a blend of *Ajo* (savings circle) + *jara* (free bonus); also "deep" in Wolaita (Ethiopian), evoking a deep savings pool. |
| **Jara** | Yoruba/Pidgin: the free bonus a seller adds on top. Here: the no-loss prize you win. |
| **Ajo / Esusu** | Nigerian rotating savings groups. |
| **Chama** | Kenyan (Swahili) savings/investment group. |
| **Susu** | Ghanaian daily savings collection. |
| **Owambe** | Nigerian party culture; "spraying" cash on celebrants. |
| **Spray** | Gifting a free (sponsor-funded) ticket to a friend. |
| **Crew** | A squad/team of players with a shared bonus pot. |
| **No-loss** | Principal always returned; only the bonus is at stake. |
| **Prize-linked savings (PLS)** | Savings product where yield funds a prize draw; principal is safe. |
| **MiniPay** | Celo's stablecoin wallet (millions of users, Africa-concentrated). |
| **Mento stablecoins** | cUSD, cKES, cCOP — local-currency stablecoins on Celo. |
| **Proof of Ship** | Celo's monthly builder program; AI-scored on hard metrics. |

---

*Ajora turns the continent's most-trusted money ritual into a daily, on-chain, no-risk game with an owambe-flavored spray loop — manufacturing real transactions and real users, funded by demonstrably real money.*
