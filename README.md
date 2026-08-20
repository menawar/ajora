# Ajora 🎉

> **Save 0.10 USDC a day, keep every cent, and win real stablecoin in the daily draw — then spray free tickets on your friends like it's an owambe.**

Ajora is a **no-loss prize-linked savings game** built as a [Freighter](https://www.opera.com/products/Freighter) Mini App on [Stellar](https://Stellar.org). It digitizes the continent's most-trusted money ritual — the rotating savings group (**Ajo** / **Esusu** / **Chama** / **Susu**) — and makes the organizer impossible: the smart contract holds the funds, so nobody can run away with the money.

- **Principal is always returned in full** (no-loss). Only the bonus — the *jara* — is at stake.
- **No upfront deposit** to start: new users get a sponsor-funded welcome ticket and can win on day one.
- **Every action is genuinely on-chain** — saving, picking, spraying, claiming.
- **Rewards are funded by real revenue** (yield + sponsors + rake), not new deposits. Not a Ponzi.

The name blends **Ajo** (the trusted savings circle) with **jara** (the free bonus you always keep). "Ajora" also means *"deep"* in Wolaita — a deep pool of savings.

📄 **Full design + technical spec:** [`AJORA_SPEC.md`](./AJORA_SPEC.md)
🎲 **Draw randomness — scheme & how to verify any draw yourself:** [`contracts/RANDOMNESS.md`](./contracts/RANDOMNESS.md)

---

## Monorepo layout

```
ajora/
├── AJORA_SPEC.md        # Full product & technical specification
├── contracts/           # Rust smart contracts (Soroban CLI)
│   ├── src/             # PotVault, DrawManager, SprayFaucet, CrewRegistry, ...
│   ├── test/            # Soroban CLI tests
│   └── script/          # Deployment scripts
├── app/                 # Stellar Web App frontend (Next.js + TypeScript + Tailwind)
├── indexer/             # Horizon/Mercury indexer — events → tables + read APIs
├── push/                # Web Push backend — draw results + streak-at-risk nudges
├── metrics/             # Committed growth-metrics rollups
├── tools/               # Post-deploy automation helpers
└── .github/workflows/   # CI/CD, keepers, static analysis
```

## Architecture

```
┌──────────┐    contribute/pick/spray/claim    ┌────────────┐
│  Freighter │ ──────────────────────────────→   │ Contracts  │
│  browser │ ←──────────────────────────────   │ (on-chain) │
└──────────+    tx receipts + events           └─────┬──────┘
      │                                               │ events
      │                                               ▼
      │                                       ┌──────────────┐
      │  NEXT_PUBLIC_* addresses              │   Indexer    │
      │  (app/.env.local)                     │  (Horizon/Mercury)     │
      │                                       │  port 42069   │
      │                                       │               │
      │                                       │  /leaderboard │
      │                                       │  /users/:addr │
      │                                       │  /periods/:id │
      │                                       │  /crews/:id   │
      │                                       │  /flags       │
      │                                       │  /notify/*    │
      │                                       │  /metrics/    │
      │                                       └──┬───────────┘
      │                                          │
      │  /notify/draw/:id                         │  /notify/at-risk
      │  /notify/unclaimed                        │  /notify/unclaimed
      │                                          ▼
      │                                  ┌──────────────┐
      │  PushSubscription                │  Push service │
      │  ──────────────────────────→     │  (Web Push)   │
      │                                  │  port 42070   │
      │  ── Push notification (won/lost) │               │
      │                                  └──────────────┘
      │
      │                              ┌──────────┐
      │  ── Keeper cron (GH Actions) │ Keepers   │
      │     commit/reveal draws      │           │
      │     harvest yield            │  tick.mjs │
      │     sweep unclaimed          │  extras   │
      │     vest referrals           │           │
      │     watchdog (dead-man's sw) │           │
      │                              └──────────┘
```

## Quickstart

### Contracts (Soroban CLI)

```bash
git clone --recursive https://github.com/menawar/ajora.git   # --recursive pulls forge-std
cd ajora/contracts
cargo build --target wasm32-unknown-unknown
cargo test
```

If you cloned without `--recursive`:

```bash
git submodule update --init --recursive
```

### App (mini-app frontend)

```bash
cd app
npm install
npm run dev     # expects contracts/.env with NEXT_PUBLIC_* variables
```

See [`app/README.md`](./app/README.md) for the full setup.

### Indexer

```bash
cd indexer
npm install
npm run dev     # starts on port 42069; requires an RPC URL for Stellar
```

See [`indexer/README.md`](./indexer/README.md).

### Push service

```bash
cd push
npm install
npm run vapid   # generate VAPID keys once, add to .env
npm start       # starts on port 42070
```

See [`push/README.md`](./push/README.md).

## Key docs

| Doc | What it covers |
|-----|---------------|
| [`AJORA_SPEC.md`](./AJORA_SPEC.md) | Full product & technical specification, §1–§18 |
| [`contracts/DEPLOYMENT.md`](./contracts/DEPLOYMENT.md) | Deploy runbook, env vars, post-deploy checklist |
| [`contracts/RANDOMNESS.md`](./contracts/RANDOMNESS.md) | Draw commit-reveal scheme + how to verify any draw |
| [`contracts/THREAT-MODEL.md`](./contracts/THREAT-MODEL.md) | Adversary model, attack trees, accepted risks |
| [`contracts/SECURITY-TRIAGE.md`](./contracts/SECURITY-TRIAGE.md) | Slither/Mythril findings triage, hardening controls |
| [`contracts/INCIDENT-PLAYBOOK.md`](./contracts/INCIDENT-PLAYBOOK.md) | Pause drill, severity levels, comms templates |

## Roadmap (Proof of Ship, 4 weeks)

| Week | Focus |
|------|-------|
| 1 | `PotVault` core loop (contribute / claim / welcome ticket) on Stellar Testnet |
| 2 | Draw + streaks + spray + crews → Stellar Pubnet (capped) |
| 3 | Yield adapter, sponsors, leaderboards, growth |
| 4 | Anti-sybil hardening, analytics, demo, submit |

See [`AJORA_SPEC.md` §15](./AJORA_SPEC.md#15-4-week-build-plan) for the detailed plan.

## Deployments

### Stellar Pubnet (chain 42220) — wired core, sources verified (Sourcify exact match)

Live core: **core_v5**, deployed 2026-07-07.

| Contract | Address |
|----------|---------|
| `PotVault` | [`CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`](https://Stellarscan.io/address/CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX) |
| `StreakSBT` | [`CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`](https://Stellarscan.io/address/CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX) |
| `SprayFaucet` | [`CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`](https://Stellarscan.io/address/CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX) |
| `DrawManager` | [`CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`](https://Stellarscan.io/address/CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX) |
| `CrewRegistry` | [`CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`](https://Stellarscan.io/address/CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX) |

Stablecoin: USDC · min contribution / ticket value: 0.10 USDC · full details + superseded cores:
[`contracts/deployments/Stellar-mainnet.json`](./contracts/deployments/Stellar-mainnet.json) ·
runbook: [`contracts/DEPLOYMENT.md`](./contracts/DEPLOYMENT.md)

## Contributing & Drips Wave 🌊

We welcome community contributions! Ajora participates in **Drips Wave** programs to reward developers who help build and maintain this project. 

- **Find Issues**: Look for issues tagged for active Waves.
- **Earn Rewards**: Fix issues to earn points and receive rewards at the end of the sprint.
- **Get Started**: Read our full [Contributing Guide](./CONTRIBUTING.md) for details on how to apply, get assigned, and submit your PRs.

## License

[MIT](./LICENSE)
