# Ajora Deployment Runbook

## Contracts & wiring order

`Deploy.s.sol` deploys and wires everything in one broadcast:

1. `PotVault(stablecoin, minContribution)`
2. `StreakSBT()`
3. `SprayFaucet(vault, verifier)` — pre-approves the vault for jara funding
4. `DrawManager(vault, keeper)`
5. `vault.setStreakSBT(streak)` · `vault.setSprayFaucet(faucet)` · `vault.setDrawManager(draw)`

`setSprayFaucet` and `setDrawManager` are **set-once** — a wiring mistake means redeploying
the vault. `setStreakSBT` is updatable (weights only, clamped ≥ 1.0x).

## Environment (`contracts/.env`, never committed)

| Var | Meaning | Default |
|---|---|---|
| `PRIVATE_KEY` | deployer key | — |
| `STABLECOIN` | Mento token address | — |
| `MIN_CONTRIBUTION` | ticket unit, token base units | `0.1e18` |
| `VERIFIER` | attests phone-verified users | deployer |
| `KEEPER` | commits/reveals draw seeds | deployer |

Stablecoin addresses: mainnet cUSD `0x765DE816845861e75A25fCA122bb6898B8B1282a`,
Alfajores cUSD `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`.

## Commands

```bash
cd contracts && set -a && . ./.env && set +a

# Alfajores
STABLECOIN=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 \
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast --private-key "$PRIVATE_KEY"

# Mainnet
STABLECOIN=0x765DE816845861e75A25fCA122bb6898B8B1282a \
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://forno.celo.org \
  --broadcast --private-key "$PRIVATE_KEY"
```

## Post-deploy checklist

1. Sanity-read on-chain: `token()`, `minContribution()`, `drawManager()`, `sprayFaucet()`,
   `streakSBT()` on the vault; `vault()`/`keeper()` on the DrawManager.
2. Record all addresses in `contracts/deployments/<network>.json` and the README table.
3. Verify sources (Sourcify works on Celo without an API key):
   `forge verify-contract --verifier sourcify --chain-id 42220 <addr> src/<C>.sol:<C>`
4. **Register the contract addresses in the KarmaGAP project profile immediately** —
   Proof of Ship transaction/user tracking only counts registered addresses.
5. Fund a sponsor campaign so welcome tickets work:
   `cusd.approve(faucet, X)` then `faucet.fundSponsorPool(X, "launch")`.
6. Update the app env (`NEXT_PUBLIC_*` addresses).

## Yield + Treasury layer (issue #7)

`DeployYield.s.sol` attaches the yield layer to an already-deployed core:

```bash
VAULT=0x… DRAW_MANAGER=0x… \
AAVE_POOL=0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402 \
A_TOKEN=0xBba98352628B0B0c4b40583F593fFCb630935a45 \
DEPOSIT_CAP=1000000000000000000000 \
forge script script/DeployYield.s.sol:DeployYield \
  --rpc-url https://forno.celo.org --broadcast --private-key "$PRIVATE_KEY"
```

Venue: the **Aave v3 cUSD reserve on Celo** (audited, instant liquidity). The script
deploys `YieldAdapter` + `Treasury` and *proposes* the adapter; the vault's 24h
timelock means you finish with `vault.applyYieldAdapter()` after the logged eta.

Operating notes:

- `vault.deployIdle(amount)` (admin) pushes idle principal to the venue, always
  leaving `liquidityBufferBps` (default 20%) of total assets liquid in-vault.
  Claims auto-recall any shortfall, so redemption never waits on the admin.
- `adapter.harvest(periodId)` is permissionless — wire it into the keeper cron
  (hourly is plenty). Yield can only land in `PotVault.fundJara`.
- `treasury.sweepUnclaimed(periodId)` (or `draw.recycleUnclaimed` directly, both
  permissionless) recycles a resolved period's unclaimed prizes after the 7-day
  claim window — add to the daily keeper pass.
- Venue changes: deploy a new adapter, drain the old one (`vault.recallDeployed`),
  then propose/apply through the timelock. `adapter.setDepositCap` bounds venue
  exposure (month-1 default 1000 cUSD).
- Fork-verify before any venue change:
  `CELO_FORK_RPC=https://forno.celo.org forge test --match-contract Fork`.

## Keeper (automated)

The stateless tick (`app/scripts/keeper-tick.mjs`) runs on GitHub Actions cron
(`.github/workflows/keeper.yml`: 23:46 commit, 00:08 reveal, three safety passes,
plus manual dispatch). Set the **`KEEPER_PRIVATE_KEY`** repository secret; without
it the workflow dry-runs. Secrets are derived per period as
`keccak256(privkey ‖ periodId)` — no state between runs, and a period that
missed its whole commit window is bootstrapped via `recommitSeed`.

Manual tick any time:

```bash
cd app && KEEPER_PRIVATE_KEY=0x… npm run keeper:tick   # or DRY_RUN=1
```
