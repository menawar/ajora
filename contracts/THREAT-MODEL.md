# Ajora Anti-Sybil Threat Model (#18)

Scope: the free-value economy (welcome tickets, sprays, referral bonuses) and the metrics
it feeds. Spec: AJORA_SPEC.md §13, §16 Risk 1. Principle: **fake accounts must earn
nothing, and free value per human is hard-bounded on-chain** — heuristics only ever gate
visibility (leaderboards/metrics), never funds.

## Attack surface: where free value exists

Free tickets are **odds-only**. `SprayFaucet._issueFreeTicket` moves the ticket's backing
from the sponsor campaign into the period's `jaraPot` and credits draw odds via
`PotVault.creditTickets` — no principal claim is ever created, so there is nothing to
"withdraw" from a farmed ticket. The only monetizable outcome is *winning a draw*, which
is what the caps below bound.

## Vectors → controls

| # | Vector | On-chain control | Proven by | Residual risk |
|---|---|---|---|---|
| 1 | Welcome-ticket farming (mint wallets, claim forever) | `welcomeTicket`: verifier-gated + `welcomed[user]` once per address | `SprayFaucet.t.sol` | Verifier integrity (see Roles) |
| 2 | Spray farming — send side | `spray`: both sides verified, `SelfSpray` blocked, `MAX_SPRAYS_PER_DAY = 3` per sender | `SprayFaucet.t.sol` | Ring of N wallets still sends 3N/day → receive-side caps (3) |
| 3 | Spray funnels — receive side | `MAX_FREE_RECEIVED_PER_DAY = 3` per recipient across welcome/spray/referral; lifetime `maxFreeValuePerUser` (default 30 tickets, admin-tunable, single choke point in `_issueFreeTicket`) | `SprayFaucetCaps.t.sol` (ring-funnel suite) | Farm rotates recipients → each still bounded; economics ≤ cap × wallets they can verify |
| 4 | Referral farming | Vests only after the invitee saves own money on `VESTING_DAYS = 3` distinct days (`CrewRegistry.vestReferral`); bonus paid through the capped choke point; `referralBonus` callable by CrewRegistry only | `CrewRegistry.t.sol` | Attacker self-funds 3×min (0.30 cUSD) per fake invitee for one bonus ticket — cost ≥ reward at current sizes |
| 5 | Wash / ring self-dealing for boards & sponsor optics | Indexer heuristics (`/flags`): reciprocal-spray 2-cycles, 5+ repeat pairs; leaderboards exclude flagged by default, `?includeFlagged=true` keeps the raw view honest (§14 sybil-adjusted vs raw) | indexer API | Heuristics are deliberately simple/legible; deeper graph analysis is roadmap |
| 6 | Withdrawal abuse | Principal exits return exactly deposits (`claimPrincipal`); the open period is locked (issue #28 fix) so tickets can't ride after an exit; free tickets carry no principal at all | `PotVault.t.sol`, invariant suite | — |
| 7 | Prize-pool draining | `settleWinnings ≤ jaraPot` (never principal); money-conservation invariants over randomized action sequences | `Invariant.t.sol` | — |

## Roles and their blast radius

- **Verifier** (MiniPay phone attestation today): compromise mints "humans". Bounded by
  the receive-side + lifetime caps (#3) — each fake human is worth at most
  `maxFreeValuePerUser` of *odds*, and only while sponsor budget lasts. Revocable
  (`setVerified(user, false)`), rotatable by admin.
- **Admin**: cap/campaign tuning; cannot mint tickets or touch principal. Vault-side
  guards (pause blocks money-in only, adapter timelock, deposit caps) are in
  `SECURITY-TRIAGE.md`'s control map. When to actually pull those levers — severity
  ladder, pause drill, comms templates — is in [`INCIDENT-PLAYBOOK.md`](./INCIDENT-PLAYBOOK.md).
- **CrewRegistry**: only path to `referralBonus`; set-once wiring.

## What we deliberately do NOT do

- No on-chain blacklist of flagged accounts — flags are off-chain visibility filters.
  A false-positive flag can cost bragging rights, never money.
- No KYC. Phone verification + (roadmap) Self protocol proof-of-personhood only.

## Roadmap

1. **Self protocol** proof-of-personhood behind the verifier role (spec §13) — verifier
   becomes an attestation bridge instead of a trusted signer.
2. Graph heuristics v2 in the indexer: shared-funder clusters (same address gas-funding
   many wallets), pick-correlation clusters.
3. Per-campaign caps so a single sponsor campaign can't be drained by one region/ring.
