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

## Deliberate zero-allowed setters

`PotVault.setStreakSBT(0)` (falls back to flat 1.0x) and `PotVault.setCrewRegistry(0)`
(disables the observer hook) accept zero **on purpose** — both are updatable observers,
not fund-bearing wiring.
