# Incident playbook (#71)

What to do when something looks wrong on the live core. Optimized for one thing:
**stop the bleeding fast, without ever trapping user money.** Pair with
[`THREAT-MODEL.md`](./THREAT-MODEL.md) (what can go wrong) and
[`SECURITY-TRIAGE.md`](./SECURITY-TRIAGE.md) (how findings are ranked).

## Roles

| Role | Who | Holds |
|---|---|---|
| **Admin** | `0x0Cf0…5DB7` | `pause()` / `unpause()`, caps, yield-adapter timelock |
| **Keeper** | `0x0Cf0…5DB7` | draw `commitSeed` / `revealAndResolve` |
| **Comms** | project lead | WhatsApp broadcast + `/celo` Farcaster + in-app notice |

> Admin and keeper are the same key today (bootstrap). Separating them is tracked
> and should land before scale — until then, guard that key accordingly.

## Severity → first action

| Sev | Looks like | First action (minutes matter) |
|---|---|---|
| **S1** | funds draining / unexpected transfers out of the vault | **`pause()` now**, then investigate |
| **S2** | draw resolving wrong, or stuck | stop the keeper (don't commit/reveal); investigate off-chain |
| **S3** | faucet drained / sybil surge | `setActiveCampaign` to an empty campaign; tighten caps |
| **S4** | frontend/indexer/push down | no on-chain action; fail over infra, post status |

Pausing is cheap and reversible on a 24h timer — **when unsure between S1 and S2,
pause.** The one thing pausing cannot do is trap funds: claims stay open by design.

## The pause drill

`pause()` trips the circuit breaker: **deposits and yield deployment stop
immediately; claims (principal + winnings) stay open** — pausing can never trap
user money (`PotVault.pause`, spec §13).

```bash
POTVAULT=0x0A9f549C0Fc859b0925c7dcB5F8A55d4020c1415
RPC=https://forno.celo.org

# 1. TRIP THE BREAKER (admin key)
cast send $POTVAULT "pause()" --private-key "$PRIVATE_KEY" --rpc-url $RPC

# 2. Confirm it's live (pausedAt != 0)
cast call $POTVAULT "pausedAt()(uint256)" --rpc-url $RPC

# 3. ...investigate. Deposits are stopped; users can still claim.

# 4. LIFT — only after the 24h cool-down (UNPAUSE_TIMELOCK); reverts if early.
cast send $POTVAULT "unpause()" --private-key "$PRIVATE_KEY" --rpc-url $RPC
```

The 24h unpause timelock is deliberate (spec §13): users see the all-clear coming
before deposits resume. Plan comms around it — announce the reopen time.

## Quarterly drill

Run on testnet (or a throwaway mainnet period) so the muscle memory is real:

1. Admin trips `pause()`; confirm `pausedAt != 0` and a `contribute()` reverts.
2. Confirm `claimPrincipal()` on a matured period still succeeds while paused.
3. Comms sends the "paused" template (below) to the test channel.
4. After the timelock, `unpause()`; confirm deposits resume.
5. Note the wall-clock from detection → paused. Target: **< 5 minutes.**

## Comms templates

Send on the same channels users onboarded through: WhatsApp broadcast, in-app
notice, and a `/celo` Farcaster post. Lead with the reassurance (money is safe),
then the fact, then the next step.

**Paused (S1/S2):**
> 🔒 We paused new saving on Ajora while we check something. **Your money is
> safe — you can still withdraw any matured savings anytime.** New saves are off
> for up to 24h. We'll post here the moment they're back on. Thank you for your
> patience 🙏

**All-clear / reopened:**
> ✅ All clear — saving is back on. Nothing was lost; principal was claimable the
> whole time. Draws resume tonight. Thanks for staying with us 💚

**Faucet paused (S3):**
> ℹ️ Free welcome/spray tickets are paused briefly while we tune anti-abuse.
> Saving, picking, and the daily draw are all running normally.

Keep it short, no jargon, no addresses — link to a status page for detail.
