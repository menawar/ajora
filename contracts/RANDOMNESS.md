# Ajora Draw Randomness — Design & Verification

How the daily winning number is generated, why no single party can steer it, and how
anyone can verify a draw from public chain data. (AJORA_SPEC.md §9; issue #5.)

## The scheme: commit–reveal blended with a future blockhash

```
              period N (picks open)                period N over
  ────────────────┬──────────────┬────────┼────────┬──────────────┬────────▶
                  │              │        │        │              │
            commitSeed(H)   anchor set    │   anchor block   revealAndResolve(S)
            H = keccak(S)   = commit      │   mined (hash    seed = keccak(S ‖
            keeper-only       block + D   │   unknowable     blockhash(anchor))
            last 15 min       (~20 min    │   at commit)     winning = seed % 9 + 1
            of the period      later)     │
```

1. **Commit.** In the final 15 minutes of a period, the keeper commits
   `H = keccak256(S)` for a secret `S`, and the contract pins
   `anchorBlock = block.number + ANCHOR_DELAY`.
2. **Anchor.** `ANCHOR_DELAY` (~20 min of blocks) puts the anchor after the period
   closes. Its blockhash does not exist when the commit is made.
3. **Reveal.** After the period ends and the anchor is mined, the keeper reveals `S`.
   The contract checks `keccak256(S) == H`, then derives
   `seed = keccak256(abi.encode(S, blockhash(anchorBlock)))` and resolves the draw.

## Why each party is powerless alone

| Actor | What they control | Why they can't steer the number |
|---|---|---|
| Keeper | chooses `S` | `S` is locked before the anchor hash exists; the blend makes the final seed unknowable to them at commit time |
| Block producer | anchor blockhash | doesn't know `S` (secret until reveal) |
| Players | picks | picks are weighted snapshots inside the period; the seed only exists after it closes |

Residual risks, stated honestly:
- **Keeper + block-producer collusion** could bias the seed. Acceptable for daily
  micro-pots; eliminated by the drand upgrade below.
- **Missed reveal window.** `blockhash` is only available for 256 blocks. If the keeper
  misses it, `recommitSeed` starts a fresh commit→anchor→reveal cycle. Deliberately
  missing is a grinding vector worth ~one extra sample per miss; every recommit emits
  an on-chain event, so grinding is publicly visible and counted.

## How anyone verifies a draw

For period `P` on Celoscan:
1. Find `SeedCommitted(P, commitment, anchorBlock)` — confirm it was emitted **during**
   period `P` (commit precedes outcome knowledge).
2. Find `DrawResolved(P, seed, winningNumber, …)` and the reveal transaction's `S`.
3. Check `keccak256(S) == commitment`.
4. Check `seed == keccak256(abi.encode(S, blockhash(anchorBlock)))` (blockhash from any
   archive node / explorer).
5. Check `winningNumber == seed % 9 + 1`.

Five equalities, all from public data. No trust in Ajora required.

## Upgrade path: drand

The seam is `revealAndResolve`. Swapping to [drand](https://drand.love) (League of
Entropy) means: commit pins a **future drand round number** instead of a block anchor;
reveal submits the round's BLS signature, verified on-chain, and the signature becomes
the seed. Removes the collusion residual entirely. Tracked as a follow-up under #19
hardening; not gold-plated now because the daily pots in month one don't justify BLS
verification gas before there are users.
