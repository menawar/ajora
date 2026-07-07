# Ajora 🎉

> **Save 0.10 cUSD a day, keep every cent, and win real stablecoin in the daily draw — then spray free tickets on your friends like it's an owambe.**

Ajora is a **no-loss prize-linked savings game** built as a [MiniPay](https://www.opera.com/products/minipay) Mini App on [Celo](https://celo.org). It digitizes the continent's most-trusted money ritual — the rotating savings group (**Ajo** / **Esusu** / **Chama** / **Susu**) — and makes the organizer impossible: the smart contract holds the funds, so nobody can run away with the money.

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
├── contracts/           # Solidity smart contracts (Foundry)
│   ├── src/             # PotVault, DrawManager, SprayFaucet, ...
│   ├── test/            # Foundry tests
│   └── script/          # Deployment scripts
├── app/                 # MiniPay Mini App frontend (Next.js + TypeScript + Tailwind)
├── indexer/             # Ponder read API for boards, metrics, notifications
├── push/                # Web Push service for draw and streak notifications
└── .github/workflows/   # CI (forge build + test, app typecheck)
```

## Architecture map

| Part | Role | Talks to | Start here |
|------|------|----------|------------|
| `contracts/` | On-chain savings, draw, spray, streak, treasury, and yield logic | Celo, keepers, app reads/writes, indexer event reads | [`contracts/README.md`](./contracts/README.md), [`contracts/DEPLOYMENT.md`](./contracts/DEPLOYMENT.md), [`contracts/THREAT-MODEL.md`](./contracts/THREAT-MODEL.md) |
| `indexer/` | Ponder service that turns contract events into leaderboards, win cards, metrics, flags, and notification digests | Celo logs, app API reads, push notification jobs | [`indexer/README.md`](./indexer/README.md) |
| `push/` | Web Push backend for draw results and streak-at-risk nudges | Indexer notification endpoints, browser push subscriptions, cron/manual ticks | [`push/README.md`](./push/README.md) |
| `app/` | MiniPay Mini App frontend for saving, picking, crews, notifications, share cards, and wallet views | Wallet, contracts, optional indexer and push service URLs | [`app/README.md`](./app/README.md) |
| Keepers | Scheduled jobs that advance draws, harvest yield, sweep reserves, vest referrals, and collect metrics | Contracts, app scripts, GitHub Actions workflows | [`app/README.md`](./app/README.md), [`.github/workflows/keeper.yml`](./.github/workflows/keeper.yml), [`.github/workflows/metrics.yml`](./.github/workflows/metrics.yml) |

## Quickstart

### Contracts (Foundry)

```bash
git clone --recursive https://github.com/menawar/ajora.git   # --recursive pulls forge-std
cd ajora/contracts
forge build
forge test -vvv
```

If you cloned without `--recursive`:

```bash
git submodule update --init --recursive
```

### App (mini-app frontend)

```bash
cd app
npm install
npm run dev
```

## Roadmap (Proof of Ship, 4 weeks)

| Week | Focus |
|------|-------|
| 1 | `PotVault` core loop (contribute / claim / welcome ticket) on Alfajores testnet |
| 2 | Draw + streaks + spray + crews → Celo mainnet (capped) |
| 3 | Yield adapter, sponsors, leaderboards, growth |
| 4 | Anti-sybil hardening, analytics, demo, submit |

See [`AJORA_SPEC.md` §15](./AJORA_SPEC.md#15-4-week-build-plan) for the detailed plan.

## Deployments

### Celo mainnet (chain 42220) — wired core, sources verified (Sourcify exact match)

| Contract | Address |
|----------|---------|
| `PotVault` | [`0x6B8617f4B6BfA6752802e883136C18720294497f`](https://celoscan.io/address/0x0A0354bA400191Ad323fF73581468601c3821C16) |
| `StreakSBT` | [`0x2390CD7A18DEc4240617ED421671790f33E4d674`](https://celoscan.io/address/0x8442Df756f1f3c55B2e9CCbA53FD85Ea17ef13DF) |
| `SprayFaucet` | [`0xA0076cE2954227f62eE7A9a35dD62c56DE516f00`](https://celoscan.io/address/0xc602Db6844855E487ff6fCBe8126d715dB1B3650) |
| `DrawManager` | [`0x18E08293D58Fbf1E434671694879f24ef63e57a8`](https://celoscan.io/address/0x405795B9F0Fc0701D62B83fE53062435BF357A23) |

Stablecoin: cUSD · min contribution / ticket value: 0.10 cUSD · full details + deprecated v0 vault:
[`contracts/deployments/celo-mainnet.json`](./contracts/deployments/celo-mainnet.json) ·
runbook: [`contracts/DEPLOYMENT.md`](./contracts/DEPLOYMENT.md)

## More docs

- [`AJORA_SPEC.md`](./AJORA_SPEC.md) — product and technical specification
- [`contracts/README.md`](./contracts/README.md) — Foundry contract workspace
- [`contracts/DEPLOYMENT.md`](./contracts/DEPLOYMENT.md) — deployment runbook and wiring order
- [`contracts/THREAT-MODEL.md`](./contracts/THREAT-MODEL.md) — anti-sybil threat model
- [`app/README.md`](./app/README.md) — MiniPay frontend commands and environment
- [`indexer/README.md`](./indexer/README.md) — Ponder read API and indexed tables
- [`push/README.md`](./push/README.md) — Web Push service, policy, API, and tests

## License

[MIT](./LICENSE)
