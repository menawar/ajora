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
