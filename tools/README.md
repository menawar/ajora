# tools/ — post-deploy automation (#94)

Small, dependency-light helpers that run the repeatable steps after a mainnet
(or testnet) core deploy, so nothing is hand-edited and nothing is forgotten.
The order below is the post-deploy checklist.

## 1. Verify sources on Sourcify

```bash
tools/verify-sourcify.sh            # default network: celo-mainnet
tools/verify-sourcify.sh alfajores  # or a named network record
```

Reads every contract + its constructor args from
`contracts/deployments/<network>.json` and verifies each on Sourcify
(`exact_match`, the project standard). Idempotent — already-verified contracts
are skipped. Needs `forge`/`cast` on PATH; no API key. After it succeeds, set
each contract's `"verification"` field in the deployment record to
`sourcify:exact_match`.

## 2. Sync the frontend env

```bash
node tools/sync-env.mjs           # write app/.env.local
node tools/sync-env.mjs --check   # CI: exit 1 if .env.local drifts from the record
node tools/sync-env.mjs --print   # print the block, write nothing
```

Generates `app/.env.local` (`NEXT_PUBLIC_*` addresses + chain id) straight from
the deployment record — the step where core_v4/v5 address drift used to creep
in. The **indexer** (`indexer/ponder.config.ts`) and **simulator**
(`ajora-sim/.env`) consume the same addresses; the script prints them so you can
paste them across.

## 3. KarmaGAP + submission checklist (manual)

On-chain metrics only accrue once the addresses are registered with the scorer,
so do this the same hour as the deploy:

- [ ] Update `contracts/deployments/<network>.json`: promote the new core, move
      the previous one into `deprecated` with a dated supersede note.
- [ ] **KarmaGAP** project profile → update the contract addresses to the new
      core (PotVault, StreakSBT, SprayFaucet, DrawManager, CrewRegistry).
- [ ] Update the addresses in the root `README.md` deployment table.
- [ ] Run `tools/verify-sourcify.sh`, then flip the `verification` fields.
- [ ] Run `node tools/sync-env.mjs`; redeploy the frontend so the live app
      points at the new core.
- [ ] Post a `/celo` Farcaster update linked to the deploy PR (score booster).

> These scripts read only the committed deployment record — they never hold a
> private key. Signing (deploy, verify submission) is done separately with your
> own wallet.
