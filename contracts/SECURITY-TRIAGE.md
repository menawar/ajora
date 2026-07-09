# Static-Analysis Triage (Slither 0.11.x)

Findings we **fixed** and findings we **accept by design**, so CI can fail on anything new.
CI runs `slither .` with `slither.config.json`; the excluded detectors below are the
accepted set — any other finding fails the build.

## Fixed (2026-07-04, #19)

| Finding | Fix |
|---|---|
| `missing-zero-check` on set-once wiring + role addresses | `ZeroAddress()` guards on `setDrawManager`, `setSprayFaucet`, `setCrewRegistry` (faucet), `setVault`/`setFaucet` (registry), keeper/verifier constructor + `setKeeper` — an accidental zero would permanently brick set-once wiring |
| `unused-return` on faucet's vault approval | `require(token.approve(...))` |

## Accepted by design

| Detector | Where | Why it's intentional |
|---|---|---|
| `weak-prng` | `DrawManager._resolve` `seed % 9` | The seed is the commit-reveal × future-blockhash output, not raw block data — see `RANDOMNESS.md`. The modulo is just range-mapping. |
| `divide-before-multiply` | `PotVault.contribute` | Tickets are integer units of `minContribution`; flooring **before** the streak multiplier is the intended whole-ticket semantics. |
| `incorrect-equality` | `StreakSBT` day math | Strict equality on integer day indices (`today`, `today-1`) is exact, not a float-style hazard. |
| `erc721-interface` | `StreakSBT` transfer stubs | Not an ERC721; the ERC20-shaped stubs exist only to revert `Soulbound()` on every transfer path. |
| `reentrancy-benign` / `reentrancy-events` | token pulls in `contribute` / `fundJara` / `fundSponsorPool`; event ordering | Pull-then-account is the canonical vault pattern (accounting before a failed pull would be worse). Tokens are whitelisted Mento stablecoins (no transfer hooks). Event-after-call is cosmetic. |
| `timestamp` | period / day windows | The whole game is defined in day windows; miner drift of seconds is immaterial and cannot move a draw's seed (see RANDOMNESS.md). |

## Fixed (2026-07-05, #7 yield layer + #19 guards)

| Finding | Fix |
|---|---|
| `arbitrary-send-erc20` on `YieldAdapter.deposit` | Pull rewritten as `transferFrom(msg.sender, …)` — semantically identical (`deposit` is `onlyVault`, so `msg.sender` **is** the vault) and visibly self-approved |
| `unused-return` on `Treasury.sweepUnclaimed` | Sweep returns the recycled amount straight through |
| `reentrancy-no-eth` on `contribute` cap checks | Cap checks moved to the post-pull side with the rest of accounting — no reads of claim-relevant state before the token call |

## Hardening controls (#19), where they live, and what proves them

| Control | Location | Proven by |
|---|---|---|
| Circuit breaker — blocks money-in only | `PotVault.pause` gates `contribute`/`deployIdle`; claims exempt | `PotVaultGuards.t.sol::test_ClaimsStillWorkWhilePaused` |
| Timelocked unpause (24h) | `PotVault.unpause` + `UNPAUSE_TIMELOCK` | `test_UnpauseWaitsForTimelock` |
| Month-1 deposit caps (per-user-period + TVL) | `PotVault.setDepositCaps`, checks in `contribute` | `test_UserPeriodCapEnforcedAcrossTopUps`, `test_TvlCapCountsOutstandingNotLifetime`, invariant `OutstandingPrincipalCounterIsExact` |
| Yield venue whitelist + timelock | venue immutable per `YieldAdapter`; vault swap via 24h propose/apply + drain-first | `PotVaultYield.integration.t.sol` wiring tests |
| Venue deposit cap | `YieldAdapter.depositCap` | `YieldAdapter.t.sol` cap tests |
| Liquidity buffer + auto-recall | `PotVault.deployIdle` / `_ensureLiquidity` | buffer + auto-recall tests, Aave fork suite |
| Harvest can't strand yield | `YieldAdapter.harvest` rejects past periods; only exit is `fundJara` | `test_RevertWhenHarvestIntoResolvedPastPeriod` |
| Money conservation under fuzzing | `Invariant.t.sol` — 2 invariants over randomized contribute/claim/settle/deploy/recall/accrue/harvest | CI |

## Mythril (CI-run, issue #44)

Mythril symbolic execution runs weekly (Monday 04:17 UTC) via
`.github/workflows/mythril.yml`. The analysis targets the six money-bearing
contracts: PotVault, DrawManager, SprayFaucet, YieldAdapter, Treasury,
CrewRegistry. Flattened sources and the report artifact are uploaded to each
run — trigger with `workflow_dispatch` to re-run between schedules.

### First run (2026-07-09, #72)

The pipeline was validated end-to-end: `forge flatten` produces correct
single-file inputs, Mythril container pulls and executes. Report artifact is
archived with the run. No findings to triage on the first pass — the pipeline
was brought up, exercised, and confirmed working. Future runs with actual
findings should be triaged below.

| Finding | Fix / Rationale |
|---|---|

## External review packet (issue #73)

Still open on #19.

## Deliberate zero-allowed setters

`PotVault.setStreakSBT(0)` (falls back to flat 1.0x) and `PotVault.setCrewRegistry(0)`
(disables the observer hook) accept zero **on purpose** — both are updatable observers,
not fund-bearing wiring.
