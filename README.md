# Ajora 🎉

> **Save 0.10 cUSD a day, keep every cent, and win real stablecoin in the daily draw — then spray free tickets on your friends like it's an owambe.**

Ajora is a **no-loss prize-linked savings game** built as a [MiniPay](https://www.opera.com/products/minipay) Mini App on [Celo](https://celo.org). It digitizes the continent's most-trusted money ritual — the rotating savings group (**Ajo** / **Esusu** / **Chama** / **Susu**) — and makes the organizer impossible: the smart contract holds the funds, so nobody can run away with the money.

- **Principal is always returned in full** (no-loss). Only the bonus — the *jara* — is at stake.
- **No upfront deposit** to start: new users get a sponsor-funded welcome ticket and can win on day one.
- **Every action is genuinely on-chain** — saving, picking, spraying, claiming.
- **Rewards are funded by real revenue** (yield + sponsors + rake), not new deposits. Not a Ponzi.

The name blends **Ajo** (the trusted savings circle) with **jara** (the free bonus you always keep). "Ajora" also means *"deep"* in Wolaita — a deep pool of savings.

📄 **Full design + technical spec:** [`AJORA_SPEC.md`](./AJORA_SPEC.md)

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
└── .github/workflows/   # CI (forge build + test, app typecheck)
```

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

## License

[MIT](./LICENSE)
